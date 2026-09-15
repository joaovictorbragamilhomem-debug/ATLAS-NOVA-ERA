"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { getProviderForOrganization } from "@/lib/whatsapp/get-provider-for-organization";
import { getConversationThread, getLastInboundAt } from "@/lib/whatsapp/get-conversation-thread";
import { isWithinReplyWindow } from "@/lib/whatsapp/reply-window";
import { e164BRToDigits, formatCentsToBRL } from "@/lib/masks";
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import { buildPixCopiaCola } from "@/lib/pix/emv-br-code";

export type ReplyActionState = { error: string | null };

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Monta o texto pronto (com o código Pix já embutido) pra pessoa revisar
// e mandar pela caixa de resposta — não envia nada sozinho.
export async function generatePixMessageAction(installmentId: string): Promise<{ body: string } | { error: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("installments")
    .select(
      "due_date, amount_cents, paid_amount_cents, contracts(late_fee_percent, late_interest_monthly_percent, organizations(name, pix_key, pix_city))"
    )
    .eq("id", installmentId)
    .maybeSingle();
  if (!data) return { error: "Parcela não encontrada." };

  const contract = unwrap(data.contracts);
  const organization = contract ? unwrap(contract.organizations) : null;
  if (!contract || !organization) return { error: "Parcela não encontrada." };

  if (!organization.pix_key || !organization.pix_city) {
    return { error: "Configure sua chave Pix e cidade em WhatsApp → Conexão antes de gerar o código." };
  }

  const today = todayInSaoPauloISODate();
  const updatedAmountCents = calculateUpdatedAmountCents({
    amountCents: data.amount_cents,
    dueDate: data.due_date,
    referenceDate: today,
    lateFeePercent: contract.late_fee_percent,
    lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
  });
  const remainingCents = calculateRemainingBalanceCents(updatedAmountCents, data.paid_amount_cents);

  let code: string;
  try {
    code = buildPixCopiaCola({
      pixKey: organization.pix_key,
      merchantName: organization.name,
      merchantCity: organization.pix_city,
      amountCents: remainingCents,
    });
  } catch {
    return { error: "Não foi possível gerar o código Pix — confira a chave cadastrada." };
  }

  return {
    body: `Segue o código Pix pra pagar (${formatCentsToBRL(remainingCents)}) — é só copiar e colar no seu banco:\n\n${code}`,
  };
}

export async function sendReplyAction(
  customerId: string,
  _prev: ReplyActionState,
  formData: FormData
): Promise<ReplyActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Escreva uma mensagem antes de enviar." };

  const supabase = await getSupabaseServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, whatsapp")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return { error: "Cliente não encontrado." };

  // Recalcula a janela de 24h a partir do banco — nunca confia no que a
  // aba do navegador achava que era o estado no momento em que abriu.
  const thread = await getConversationThread(membership.organizationId, customerId);
  const lastInboundAt = getLastInboundAt(thread);
  if (!isWithinReplyWindow(lastInboundAt)) {
    return { error: "Essa conversa está fora da janela de 24h da Meta — envie um modelo aprovado na aba WhatsApp." };
  }

  const connection = await getProviderForOrganization(membership.organizationId);
  if (!connection) return { error: "WhatsApp não está conectado para esta organização." };

  const result = await connection.provider.sendTextMessage({ to: customer.whatsapp, body });
  if (result.error) return { error: `Não foi possível enviar: ${result.error}` };

  const admin = getSupabaseAdminClient();
  if (!admin) return { error: "Erro interno ao registrar a mensagem." };

  const { error: insertError } = await admin.from("whatsapp_messages").insert({
    organization_id: membership.organizationId,
    customer_id: customerId,
    direction: "outbound",
    body,
    customer_phone_digits: e164BRToDigits(customer.whatsapp),
    provider_message_id: result.providerMessageId,
    occurred_at: new Date().toISOString(),
  });
  if (insertError) return { error: "Mensagem enviada, mas houve um erro ao registrar na conversa." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "whatsapp.reply_sent",
    entityType: "customer",
    entityId: customerId,
    after: { body },
  });

  revalidatePath(`/app/conversas/${customerId}`);
  revalidatePath(`/app/conversas`);
  return { error: null };
}
