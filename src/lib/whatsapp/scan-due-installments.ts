import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPauloISODate, addDaysToISODate } from "@/lib/finance/dates";
import { renderTemplate } from "@/lib/message-template";
import { fetchInstallmentContext, buildVariables, enqueue } from "./enqueue";

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];

function unwrapTemplate(value: unknown): { body: string; active: boolean } | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? null;
}

// Roda pelo cron: olha as regras de tempo (lembrete antes, vence hoje,
// atraso depois de X dias) e enfileira uma mensagem para cada parcela em
// aberto que bate com a data de hoje + esses dias.
export async function scanAndEnqueueDueInstallmentMessages(): Promise<{ enqueued: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { enqueued: 0 };

  const today = todayInSaoPauloISODate();

  const { data: rules } = await admin
    .from("automation_rules")
    .select("id, organization_id, trigger_type, days_offset, template_id, message_templates(body, active)")
    .in("trigger_type", ["reminder_before", "due_today", "overdue_after"])
    .eq("active", true);

  let enqueuedCount = 0;

  for (const rule of rules ?? []) {
    const template = unwrapTemplate(rule.message_templates);
    if (!template || !template.active) continue;

    let targetDate: string;
    if (rule.trigger_type === "due_today") targetDate = today;
    else if (rule.trigger_type === "reminder_before") targetDate = addDaysToISODate(today, rule.days_offset ?? 0);
    else targetDate = addDaysToISODate(today, -(rule.days_offset ?? 0));

    const { data: installments } = await admin
      .from("installments")
      .select("id")
      .eq("organization_id", rule.organization_id)
      .eq("due_date", targetDate)
      .in("status", OPEN_STATUSES);

    for (const installment of installments ?? []) {
      const ctx = await fetchInstallmentContext(admin, installment.id);
      if (!ctx) continue;

      const variables = buildVariables(ctx, today);
      await enqueue(admin, {
        organizationId: ctx.organizationId,
        customerId: ctx.customerId,
        installmentId: ctx.installmentId,
        contractId: ctx.contractId,
        automationRuleId: rule.id,
        templateId: rule.template_id,
        triggerType: rule.trigger_type,
        scheduledFor: new Date().toISOString(),
        renderedBody: renderTemplate(template.body, variables),
      });
      enqueuedCount++;
    }
  }

  return { enqueued: enqueuedCount };
}
