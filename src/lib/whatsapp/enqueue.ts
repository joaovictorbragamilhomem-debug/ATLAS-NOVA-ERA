import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPauloISODate, daysBetweenISODates } from "@/lib/finance/dates";
import {
  calculateDaysLate,
  calculateUpdatedAmountCents,
  calculateRemainingBalanceCents,
} from "@/lib/finance/installment-amount";
import { renderTemplate } from "@/lib/message-template";
import { formatCentsToBRL, formatISODateToBR } from "@/lib/masks";

type InstallmentContext = {
  installmentId: string;
  contractId: string;
  customerId: string;
  customerName: string;
  organizationId: string;
  organizationName: string;
  pixKey: string | null;
  dueDate: string;
  amountCents: number;
  paidAmountCents: number;
  installmentNumber: number;
  installmentsCount: number;
  lateFeePercent: number;
  lateInterestMonthlyPercent: number;
};

function unwrap<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function fetchInstallmentContext(
  admin: SupabaseClient,
  installmentId: string
): Promise<InstallmentContext | null> {
  const { data } = await admin
    .from("installments")
    .select(
      "id, contract_id, due_date, amount_cents, paid_amount_cents, number, contracts(customer_id, installments_count, late_fee_percent, late_interest_monthly_percent, organization_id, customers(id, name), organizations(name, pix_key))"
    )
    .eq("id", installmentId)
    .maybeSingle();
  if (!data) return null;

  const contract = unwrap(data.contracts);
  if (!contract) return null;
  const customer = unwrap(contract.customers);
  const organization = unwrap(contract.organizations);
  if (!customer || !organization) return null;

  return {
    installmentId: data.id,
    contractId: data.contract_id,
    customerId: customer.id,
    customerName: customer.name,
    organizationId: contract.organization_id,
    organizationName: organization.name,
    pixKey: organization.pix_key,
    dueDate: data.due_date,
    amountCents: data.amount_cents,
    paidAmountCents: data.paid_amount_cents,
    installmentNumber: data.number,
    installmentsCount: contract.installments_count,
    lateFeePercent: contract.late_fee_percent,
    lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
  };
}

function buildVariables(ctx: InstallmentContext, today: string): Record<string, string> {
  const updatedAmountCents = calculateUpdatedAmountCents({
    amountCents: ctx.amountCents,
    dueDate: ctx.dueDate,
    referenceDate: today,
    lateFeePercent: ctx.lateFeePercent,
    lateInterestMonthlyPercent: ctx.lateInterestMonthlyPercent,
  });

  return {
    nome: ctx.customerName,
    empresa: ctx.organizationName,
    valor_parcela: formatCentsToBRL(ctx.amountCents),
    numero_parcela: `${ctx.installmentNumber}/${ctx.installmentsCount}`,
    vencimento: formatISODateToBR(ctx.dueDate),
    dias_atraso: String(calculateDaysLate(ctx.dueDate, today)),
    valor_atualizado: formatCentsToBRL(updatedAmountCents),
    saldo_restante: formatCentsToBRL(calculateRemainingBalanceCents(updatedAmountCents, ctx.paidAmountCents)),
    // Só faz sentido pra lembrete antes do vencimento — parcela já vencida
    // fica em 0, não em número negativo.
    dias_para_vencer: String(Math.max(0, daysBetweenISODates(today, ctx.dueDate))),
    chave_pix: ctx.pixKey ?? "",
    atendente: "",
  };
}

async function enqueue(
  admin: SupabaseClient,
  params: {
    organizationId: string;
    customerId: string;
    installmentId: string | null;
    contractId: string | null;
    automationRuleId: string;
    templateId: string;
    triggerType: string;
    scheduledFor: string;
    renderedBody: string;
  }
): Promise<void> {
  const { error } = await admin.from("message_queue").insert({
    organization_id: params.organizationId,
    customer_id: params.customerId,
    installment_id: params.installmentId,
    contract_id: params.contractId,
    automation_rule_id: params.automationRuleId,
    template_id: params.templateId,
    trigger_type: params.triggerType,
    scheduled_for: params.scheduledFor,
    rendered_body: params.renderedBody,
  });

  // 23505 = já existe uma mensagem enfileirada para essa parcela, gatilho e
  // dia — é a trava contra cobrança em dobro funcionando, não um erro real.
  if (error && error.code !== "23505") {
    console.error("[whatsapp enqueue]", error.message);
  }
}

async function findActiveRule(admin: SupabaseClient, organizationId: string, triggerType: string, daysOffset: number | null) {
  let query = admin
    .from("automation_rules")
    .select("id, template_id, message_templates(body, active)")
    .eq("organization_id", organizationId)
    .eq("trigger_type", triggerType)
    .eq("active", true);

  query = daysOffset === null ? query.is("days_offset", null) : query.eq("days_offset", daysOffset);

  const { data } = await query.maybeSingle();
  if (!data) return null;
  const template = unwrap(data.message_templates);
  if (!template || !template.active) return null;
  return { ruleId: data.id, templateId: data.template_id, templateBody: template.body };
}

// Chamado logo depois que um contrato novo é criado (createContractAction).
export async function enqueueContractCreatedMessage(contractId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { data: firstInstallment } = await admin
    .from("installments")
    .select("id")
    .eq("contract_id", contractId)
    .eq("number", 1)
    .maybeSingle();
  if (!firstInstallment) return;

  const ctx = await fetchInstallmentContext(admin, firstInstallment.id);
  if (!ctx) return;

  const rule = await findActiveRule(admin, ctx.organizationId, "contract_created", null);
  if (!rule) return;

  const today = todayInSaoPauloISODate();
  const variables = buildVariables(ctx, today);

  await enqueue(admin, {
    organizationId: ctx.organizationId,
    customerId: ctx.customerId,
    installmentId: ctx.installmentId,
    contractId: ctx.contractId,
    automationRuleId: rule.ruleId,
    templateId: rule.templateId,
    triggerType: "contract_created",
    scheduledFor: new Date().toISOString(),
    renderedBody: renderTemplate(rule.templateBody, variables),
  });
}

// Chamado logo depois de uma baixa (registerInstallmentPaymentAction).
export async function enqueuePaymentConfirmationMessage(installmentId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const ctx = await fetchInstallmentContext(admin, installmentId);
  if (!ctx) return;

  const rule = await findActiveRule(admin, ctx.organizationId, "payment_confirmation", null);
  if (!rule) return;

  const today = todayInSaoPauloISODate();
  const variables = buildVariables(ctx, today);

  await enqueue(admin, {
    organizationId: ctx.organizationId,
    customerId: ctx.customerId,
    installmentId: ctx.installmentId,
    contractId: ctx.contractId,
    automationRuleId: rule.ruleId,
    templateId: rule.templateId,
    triggerType: "payment_confirmation",
    scheduledFor: new Date().toISOString(),
    renderedBody: renderTemplate(rule.templateBody, variables),
  });
}

export { buildVariables, fetchInstallmentContext, findActiveRule, enqueue };
export type { InstallmentContext };
