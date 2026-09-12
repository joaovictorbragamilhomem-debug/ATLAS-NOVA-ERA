"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";

export type InstallmentActionResult = { error: string | null };

const PAYMENT_METHODS = ["pix", "dinheiro", "transferencia", "cartao"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Toda parcela que ainda pode receber dinheiro. "reversed" volta a aceitar
// pagamento normalmente — o rótulo só avisa a equipe que já teve um estorno
// aqui antes, não trava a parcela para sempre.
const PAYABLE_STATUSES = ["pending", "partially_paid", "reversed"];

export async function registerInstallmentPaymentAction(
  installmentId: string,
  amountCents: number,
  method: PaymentMethod
): Promise<InstallmentActionResult> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { error: "Informe um valor de pagamento válido." };
  }
  if (!PAYMENT_METHODS.includes(method)) return { error: "Forma de pagamento inválida." };

  const supabase = await getSupabaseServerClient();

  const { data: installment } = await supabase
    .from("installments")
    .select("id, contract_id, amount_cents, paid_amount_cents, status")
    .eq("id", installmentId)
    .maybeSingle();

  if (!installment) return { error: "Parcela não encontrada." };
  if (!PAYABLE_STATUSES.includes(installment.status)) {
    return { error: "Essa parcela não pode receber pagamento no estado atual." };
  }

  const newPaidAmountCents = installment.paid_amount_cents + amountCents;
  const newStatus = newPaidAmountCents >= installment.amount_cents ? "paid" : "partially_paid";

  const { error: paymentError } = await supabase.from("payments").insert({
    organization_id: membership.organizationId,
    installment_id: installmentId,
    amount_cents: amountCents,
    method,
    created_by: membership.userId,
  });
  if (paymentError) return { error: "Não foi possível registrar o pagamento." };

  const { error: updateError } = await supabase
    .from("installments")
    .update({ paid_amount_cents: newPaidAmountCents, status: newStatus })
    .eq("id", installmentId);
  if (updateError) return { error: "Pagamento registrado, mas houve um erro ao atualizar a parcela." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "installment.payment_registered",
    entityType: "installment",
    entityId: installmentId,
    before: { paid_amount_cents: installment.paid_amount_cents, status: installment.status },
    after: { paid_amount_cents: newPaidAmountCents, status: newStatus, amount_cents: amountCents, method },
  });

  revalidatePath(`/app/contratos/${installment.contract_id}`);
  return { error: null };
}

export async function reverseInstallmentPaymentAction(
  paymentId: string,
  reason: string
): Promise<InstallmentActionResult> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  if (membership.role === "operator") {
    return { error: "Só Dono ou Gestor podem estornar um pagamento." };
  }

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "Informe o motivo do estorno." };

  const supabase = await getSupabaseServerClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, installment_id, reversed_at")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return { error: "Pagamento não encontrado." };
  if (payment.reversed_at) return { error: "Esse pagamento já foi estornado." };

  const { data: installment } = await supabase
    .from("installments")
    .select("id, contract_id, amount_cents, status")
    .eq("id", payment.installment_id)
    .maybeSingle();
  if (!installment) return { error: "Parcela não encontrada." };

  // Gatilho do banco (guard_payment_reversal) também exige dono/gestor —
  // essa checagem de papel acima só existe para dar um erro mais amigável.
  const { error: reversalError } = await supabase
    .from("payments")
    .update({ reversed_at: new Date().toISOString(), reversed_reason: trimmedReason })
    .eq("id", paymentId);
  if (reversalError) return { error: "Não foi possível estornar o pagamento." };

  const { data: remainingPayments } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("installment_id", installment.id)
    .is("reversed_at", null);

  const remainingPaidCents = (remainingPayments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  const newStatus =
    remainingPaidCents === 0 ? "reversed" : remainingPaidCents >= installment.amount_cents ? "paid" : "partially_paid";

  const { error: updateError } = await supabase
    .from("installments")
    .update({ paid_amount_cents: remainingPaidCents, status: newStatus })
    .eq("id", installment.id);
  if (updateError) return { error: "Pagamento estornado, mas houve um erro ao atualizar a parcela." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "installment.payment_reversed",
    entityType: "installment",
    entityId: installment.id,
    before: { status: installment.status },
    after: { status: newStatus, paid_amount_cents: remainingPaidCents, reason: trimmedReason },
  });

  revalidatePath(`/app/contratos/${installment.contract_id}`);
  return { error: null };
}
