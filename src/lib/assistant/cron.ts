import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import { renderTemplate } from "@/lib/message-template";
import { buildVariables, enqueue, fetchInstallmentContext } from "@/lib/whatsapp/enqueue";
import { respondToInboundMessage } from "./run-assistant";

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];
// The daily cron has a time limit; each answer takes a model call, so they
// run side by side (different customers) and only a handful per run.
const MAX_REPLIES_PER_RUN = 5;

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Morning run: answers customers who wrote outside business hours (their
// messages were left unclaimed) while the 24h reply window is still open.
export async function answerPendingAssistantMessages(): Promise<{ assistantReplied: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { assistantReplied: 0 };

  const { data: orgs } = await admin.from("organizations").select("id").eq("assistant_enabled", true);
  const orgIds = (orgs ?? []).map((o) => o.id);
  if (orgIds.length === 0) return { assistantReplied: 0 };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("whatsapp_messages")
    .select("id, customer_id, direction")
    .in("organization_id", orgIds)
    .not("customer_id", "is", null)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(500);

  // Latest message per customer; only conversations whose last word is the
  // customer's are still waiting for an answer.
  const latestByCustomer = new Map<string, { id: string; direction: string }>();
  for (const row of recent ?? []) {
    if (row.customer_id && !latestByCustomer.has(row.customer_id)) latestByCustomer.set(row.customer_id, row);
  }
  const waiting = [...latestByCustomer.values()].filter((m) => m.direction === "inbound").map((m) => m.id);
  if (waiting.length === 0) return { assistantReplied: 0 };

  const { data: handled } = await admin.from("assistant_runs").select("inbound_message_id").in("inbound_message_id", waiting);
  const handledIds = new Set((handled ?? []).map((r) => r.inbound_message_id));

  const toAnswer = waiting.filter((messageId) => !handledIds.has(messageId)).slice(0, MAX_REPLIES_PER_RUN);
  const outcomes = await Promise.all(toAnswer.map((id) => respondToInboundMessage(id)));
  return { assistantReplied: outcomes.filter((outcome) => outcome === "replied").length };
}

// "Pago na sexta": on the promised day (or later, if a run was missed),
// queue one reminder with the store's own overdue template.
export async function enqueuePromiseReminders(): Promise<{ promiseReminders: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { promiseReminders: 0 };

  const today = todayInSaoPauloISODate();
  const { data: promises } = await admin
    .from("payment_promises")
    .select("id, organization_id, installment_id, installments(status)")
    .eq("status", "open")
    .lte("promised_date", today);

  let promiseReminders = 0;
  for (const promise of promises ?? []) {
    const installment = unwrap(promise.installments);
    if (!installment || !OPEN_STATUSES.includes(installment.status)) {
      await admin.from("payment_promises").update({ status: "canceled" }).eq("id", promise.id);
      continue;
    }

    const rule = await findReminderRule(promise.organization_id);
    const ctx = await fetchInstallmentContext(admin, promise.installment_id);
    if (rule && ctx) {
      await enqueue(admin, {
        organizationId: ctx.organizationId,
        customerId: ctx.customerId,
        installmentId: ctx.installmentId,
        contractId: ctx.contractId,
        automationRuleId: rule.ruleId,
        templateId: rule.templateId,
        triggerType: "promise_reminder",
        scheduledFor: new Date().toISOString(),
        renderedBody: renderTemplate(rule.templateBody, buildVariables(ctx, today)),
      });
      promiseReminders++;
    }
    // Without an overdue/due-today rule there is no approved template to
    // send outside the 24h window — the promise just closes.
    await admin.from("payment_promises").update({ status: rule && ctx ? "reminded" : "canceled" }).eq("id", promise.id);
  }
  return { promiseReminders };
}

async function findReminderRule(
  organizationId: string
): Promise<{ ruleId: string; templateId: string; templateBody: string } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: rules } = await admin
    .from("automation_rules")
    .select("id, trigger_type, days_offset, template_id, message_templates(body, active)")
    .eq("organization_id", organizationId)
    .in("trigger_type", ["overdue_after", "due_today"])
    .eq("active", true);

  // Prefer the earliest overdue reminder (its wording fits a late
  // installment); fall back to the due-today one.
  const ordered = [...(rules ?? [])].sort(
    (a, b) =>
      (a.trigger_type === "overdue_after" ? 0 : 1) - (b.trigger_type === "overdue_after" ? 0 : 1) ||
      (a.days_offset ?? 0) - (b.days_offset ?? 0)
  );
  for (const rule of ordered) {
    const template = unwrap(rule.message_templates);
    if (template?.active) return { ruleId: rule.id, templateId: rule.template_id, templateBody: template.body };
  }
  return null;
}

// Installments with an open promise skip the regular reminders until the
// promised date (used by the daily scan).
export async function getInstallmentsWithOpenPromise(): Promise<Set<string>> {
  const admin = getSupabaseAdminClient();
  if (!admin) return new Set();
  const { data } = await admin
    .from("payment_promises")
    .select("installment_id")
    .eq("status", "open")
    .gte("promised_date", todayInSaoPauloISODate());
  return new Set((data ?? []).map((p) => p.installment_id));
}
