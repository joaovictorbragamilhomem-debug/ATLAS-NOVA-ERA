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
import { e164BRToDigits } from "@/lib/masks";

export type ReplyActionState = { error: string | null };

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
