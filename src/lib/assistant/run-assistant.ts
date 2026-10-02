import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import {
  calculateDaysLate,
  calculateRemainingBalanceCents,
  calculateUpdatedAmountCents,
} from "@/lib/finance/installment-amount";
import { buildPixCopiaCola } from "@/lib/pix/emv-br-code";
import { parsePixKey } from "@/lib/pix/pix-key";
import { e164BRToDigits, formatCentsToBRL } from "@/lib/masks";
import { isWithinReplyWindow } from "@/lib/whatsapp/reply-window";
import { getProviderForOrganization } from "@/lib/whatsapp/get-provider-for-organization";
import { toSubscriptionInfo, type SubscriptionRow } from "@/lib/auth/subscription-status";
import { logAudit } from "@/lib/audit/log";
import { sendEmail } from "@/lib/email/resend";
import { assistantAlertEmail } from "@/lib/email/templates";
import { isAssistantBusinessHours } from "./business-hours";
import { finalizeDecision, type FinalDecision } from "./decision";
import { askAssistantModel, isAssistantModelConfigured } from "./model";
import {
  buildSystemPrompt,
  buildUserPrompt,
  firstName,
  pickUrgentInstallment,
  type AssistantInstallment,
  type AssistantThreadMessage,
} from "./prompt";

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];
const HUMAN_TAKEOVER_MS = 12 * 60 * 60 * 1000;
// Non-text messages are stored by the webhook as "[mensagem tipo <type> …]".
const NON_TEXT_PATTERN = /^\[mensagem tipo (\w+)/;
// Media that is often a payment receipt: a person should look at it.
const MEDIA_TYPES = new Set(["image", "document", "audio", "video"]);
const MAX_UPCOMING_INSTALLMENTS = 2;

export type AssistantOutcome =
  | "not_applicable"
  | "disabled"
  | "outside_hours"
  | "duplicate"
  | "skipped"
  | "replied"
  | "failed";

type Org = { id: string; name: string; pix_key: string | null; pix_city: string | null };
type Customer = { id: string; name: string; whatsapp: string; whatsapp_opted_out_at: string | null };
type InboundMessage = { id: string; organization_id: string; customer_id: string; body: string; occurred_at: string };

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Handles one customer message for a store that turned the assistant on.
// Safe to call more than once for the same message (webhook redelivery,
// morning cron): assistant_runs.inbound_message_id is the lock.
export async function respondToInboundMessage(inboundMessageId: string, now: Date = new Date()): Promise<AssistantOutcome> {
  const admin = getSupabaseAdminClient();
  if (!admin) return "not_applicable";

  const { data: message } = await admin
    .from("whatsapp_messages")
    .select("id, organization_id, customer_id, direction, body, occurred_at")
    .eq("id", inboundMessageId)
    .maybeSingle();
  if (!message || message.direction !== "inbound" || !message.customer_id) return "not_applicable";

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, pix_key, pix_city, assistant_enabled")
    .eq("id", message.organization_id)
    .maybeSingle();
  if (!org?.assistant_enabled) return "disabled";

  // Checked before taking the lock: a message that arrives at night stays
  // unclaimed and is answered by the morning cron run.
  if (!isAssistantBusinessHours(now)) return "outside_hours";

  const { data: run, error: lockError } = await admin
    .from("assistant_runs")
    .insert({ organization_id: org.id, customer_id: message.customer_id, inbound_message_id: message.id })
    .select("id")
    .single();
  if (lockError || !run) return "duplicate";

  const finish = async (status: "replied" | "skipped" | "failed", fields: Record<string, unknown> = {}) => {
    await admin.from("assistant_runs").update({ status, ...fields }).eq("id", run.id);
  };

  // Once the WhatsApp message went out, a later error must not tell the
  // store that the customer got no answer.
  let delivered = false;

  try {
    const { data: customer } = await admin
      .from("customers")
      .select("id, name, whatsapp, whatsapp_opted_out_at")
      .eq("id", message.customer_id)
      .single();
    if (!customer) {
      await finish("skipped", { detail: "cliente_nao_encontrado" });
      return "skipped";
    }

    const quietReason = await findReasonToStayQuiet(admin, org, customer, message as InboundMessage, now);
    if (quietReason) {
      await finish("skipped", { detail: quietReason });
      return "skipped";
    }

    const today = todayInSaoPauloISODate();
    const installments = await loadOpenInstallments(admin, org.id, customer.id, today);
    const hasPix = Boolean(org.pix_key && org.pix_city);

    let decision: FinalDecision;
    let usage: { input_tokens?: number; output_tokens?: number } = {};

    const nonTextType = message.body.match(NON_TEXT_PATTERN)?.[1] ?? null;
    if (nonTextType && !MEDIA_TYPES.has(nonTextType)) {
      // Reactions (👍), stickers, locations…: nothing to answer.
      await finish("skipped", { detail: `tipo_${nonTextType}` });
      return "skipped";
    }

    if (nonTextType) {
      // Photos, audio, documents: the assistant can't read them — most of
      // the time it's a payment receipt, so a person should look.
      decision = {
        action: "handoff",
        reply: `Recebi! Vou repassar para a equipe da ${org.name} conferir. 🙂`,
        reason: "Cliente mandou um arquivo pelo WhatsApp (pode ser um comprovante) — confira na conversa.",
      };
    } else {
      const [thread, openPromiseDate] = await Promise.all([
        loadThread(admin, org.id, customer.id),
        loadOpenPromiseDate(admin, customer.id, today),
      ]);
      const result = await askAssistantModel(
        buildSystemPrompt(org.name),
        buildUserPrompt({
          storeName: org.name,
          customerName: customer.name,
          today,
          installments,
          hasPix,
          openPromiseDate,
          thread,
        })
      );
      if ("error" in result) throw new Error(result.error);
      usage = { input_tokens: result.inputTokens, output_tokens: result.outputTokens };
      decision = finalizeDecision(result.decision, {
        today,
        hasPix,
        hasOpenInstallment: pickUrgentInstallment(installments) !== null,
      });
    }

    let body = decision.reply;
    if (decision.action === "send_pix") {
      const pixText = buildPixText(org, pickUrgentInstallment(installments));
      if (pixText) {
        body = `${decision.reply}\n\n${pixText}`;
      } else {
        decision = {
          action: "handoff",
          reply: "Vou pedir para alguém da loja te mandar os dados para pagamento, tudo bem?",
          reason: "Cliente pediu o Pix, mas não foi possível gerar o código — confira a chave Pix cadastrada.",
        };
        body = decision.reply;
      }
    }

    if (!body) {
      await finish("skipped", { action: decision.action, detail: "sem_resposta_necessaria", ...usage });
      return "skipped";
    }

    const connection = await getProviderForOrganization(org.id);
    if (!connection) throw new Error("WhatsApp desconectado");
    const sent = await connection.provider.sendTextMessage({ to: customer.whatsapp, body });
    if (sent.error) throw new Error(`Envio falhou: ${sent.error}`);
    delivered = true;

    const { data: outbound } = await admin
      .from("whatsapp_messages")
      .insert({
        organization_id: org.id,
        customer_id: customer.id,
        direction: "outbound",
        body,
        customer_phone_digits: e164BRToDigits(customer.whatsapp),
        provider_message_id: sent.providerMessageId,
        occurred_at: new Date().toISOString(),
        sent_by_assistant: true,
      })
      .select("id")
      .single();

    await applySideEffects(admin, { org, customer, decision, runId: run.id, installments });

    await finish("replied", { action: decision.action, reply_message_id: outbound?.id ?? null, ...usage });
    await logAudit({
      organizationId: org.id,
      userId: null,
      action: "assistant.replied",
      entityType: "customer",
      entityId: customer.id,
      after: { action: decision.action, body: body.slice(0, 500) },
    });
    return "replied";
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[assistant]", detail);
    await finish("failed", { detail: detail.slice(0, 300) });
    await openAlert(admin, {
      organizationId: org.id,
      customerId: message.customer_id,
      runId: run.id,
      kind: "needs_human",
      reason: delivered
        ? "O assistente respondeu o cliente, mas houve um erro ao registrar o que foi combinado — confira a conversa."
        : "O assistente não conseguiu responder a última mensagem — responda você mesmo.",
    });
    return "failed";
  }
}

async function findReasonToStayQuiet(
  admin: SupabaseClient,
  org: Org,
  customer: Customer,
  message: InboundMessage,
  now: Date
): Promise<string | null> {
  if (customer.whatsapp_opted_out_at) return "cliente_pediu_para_parar";
  if (!isWithinReplyWindow(message.occurred_at, now)) return "fora_da_janela_24h";
  if (!isAssistantModelConfigured()) return "ia_sem_chave";

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan, status, trial_ends_at, current_period_end")
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!subscription || toSubscriptionInfo(subscription as SubscriptionRow).isReadOnly) return "conta_somente_leitura";

  const { count: openAlerts } = await admin
    .from("assistant_alerts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("customer_id", customer.id)
    .is("resolved_at", null);
  if ((openAlerts ?? 0) > 0) return "aguardando_a_loja";

  const { data: later } = await admin
    .from("whatsapp_messages")
    .select("direction")
    .eq("organization_id", org.id)
    .eq("customer_id", customer.id)
    .gt("occurred_at", message.occurred_at)
    .neq("id", message.id);
  // A newer message is answered by its own run (with the whole thread).
  if (later?.some((m) => m.direction === "inbound")) return "mensagem_mais_nova";
  if (later?.some((m) => m.direction === "outbound")) return "ja_respondida";

  const since = new Date(now.getTime() - HUMAN_TAKEOVER_MS).toISOString();
  const { count: teamReplies } = await admin
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("customer_id", customer.id)
    .eq("direction", "outbound")
    .eq("sent_by_assistant", false)
    .gte("occurred_at", since);
  if ((teamReplies ?? 0) > 0) return "equipe_assumiu";

  const connection = await getProviderForOrganization(org.id);
  if (!connection) return "whatsapp_desconectado";

  return null;
}

async function loadOpenInstallments(
  admin: SupabaseClient,
  organizationId: string,
  customerId: string,
  today: string
): Promise<AssistantInstallment[]> {
  const { data } = await admin
    .from("installments")
    .select(
      "id, number, due_date, amount_cents, paid_amount_cents, contracts!inner(customer_id, installments_count, late_fee_percent, late_interest_monthly_percent)"
    )
    .eq("organization_id", organizationId)
    .eq("contracts.customer_id", customerId)
    .in("status", OPEN_STATUSES)
    .order("due_date");

  const all = (data ?? []).flatMap((row) => {
    const contract = unwrap(row.contracts);
    if (!contract) return [];
    const updated = calculateUpdatedAmountCents({
      amountCents: row.amount_cents,
      dueDate: row.due_date,
      referenceDate: today,
      lateFeePercent: contract.late_fee_percent,
      lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
    });
    return [
      {
        installmentId: row.id,
        number: row.number,
        total: contract.installments_count,
        dueDate: row.due_date,
        remainingCents: calculateRemainingBalanceCents(updated, row.paid_amount_cents),
        daysLate: calculateDaysLate(row.due_date, today),
      },
    ];
  });

  // Everything overdue or due today, plus the next couple — the model
  // doesn't need the whole carnê.
  const dueNow = all.filter((i) => i.dueDate <= today);
  const upcoming = all.filter((i) => i.dueDate > today).slice(0, MAX_UPCOMING_INSTALLMENTS);
  return [...dueNow, ...upcoming];
}

async function loadThread(admin: SupabaseClient, organizationId: string, customerId: string): Promise<AssistantThreadMessage[]> {
  const [{ data: messages }, { data: automatic }] = await Promise.all([
    admin
      .from("whatsapp_messages")
      .select("direction, body, occurred_at, sent_by_assistant")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .order("occurred_at", { ascending: false })
      .limit(14),
    // Automatic reminders live in the queue, not in whatsapp_messages — the
    // customer is often answering one of them ("ok, pago amanhã").
    admin
      .from("message_queue")
      .select("rendered_body, updated_at")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .in("status", ["sent", "delivered", "read"])
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const thread: AssistantThreadMessage[] = [
    ...(messages ?? []).map((m) => ({
      author: (m.direction === "inbound" ? "customer" : m.sent_by_assistant ? "assistant" : "team") as AssistantThreadMessage["author"],
      body: m.body,
      occurredAt: m.occurred_at,
    })),
    ...(automatic ?? []).map((m) => ({ author: "automatic" as const, body: m.rendered_body, occurredAt: m.updated_at })),
  ];
  return thread.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

async function loadOpenPromiseDate(admin: SupabaseClient, customerId: string, today: string): Promise<string | null> {
  const { data } = await admin
    .from("payment_promises")
    .select("promised_date")
    .eq("customer_id", customerId)
    .eq("status", "open")
    .gte("promised_date", today)
    .order("promised_date")
    .limit(1)
    .maybeSingle();
  return data?.promised_date ?? null;
}

function buildPixText(org: Org, installment: AssistantInstallment | null): string | null {
  if (!installment || !org.pix_key || !org.pix_city) return null;
  const parsedKey = parsePixKey(org.pix_key);
  try {
    const code = buildPixCopiaCola({
      pixKey: parsedKey?.key ?? org.pix_key,
      merchantName: org.name,
      merchantCity: org.pix_city,
      amountCents: installment.remainingCents,
    });
    return `Parcela ${installment.number}/${installment.total} — ${formatCentsToBRL(installment.remainingCents)}\nPix copia e cola:\n${code}`;
  } catch (error) {
    console.error("[assistant pix]", error);
    return null;
  }
}

async function applySideEffects(
  admin: SupabaseClient,
  params: { org: Org; customer: Customer; decision: FinalDecision; runId: string; installments: AssistantInstallment[] }
): Promise<void> {
  const { org, customer, decision, runId } = params;

  if (decision.action === "promise") {
    const installment = pickUrgentInstallment(params.installments);
    if (!installment) return;
    // A new date replaces any earlier promise for the same installment.
    await admin
      .from("payment_promises")
      .update({ status: "canceled" })
      .eq("installment_id", installment.installmentId)
      .eq("status", "open");
    await admin.from("payment_promises").insert({
      organization_id: org.id,
      customer_id: customer.id,
      installment_id: installment.installmentId,
      promised_date: decision.promiseDate,
      run_id: runId,
    });
    return;
  }

  if (decision.action === "opt_out") {
    await admin.from("customers").update({ whatsapp_opted_out_at: new Date().toISOString() }).eq("id", customer.id);
    await openAlert(admin, {
      organizationId: org.id,
      customerId: customer.id,
      runId,
      kind: "opt_out",
      reason: `${firstName(customer.name)} pediu para não receber mais mensagens automáticas pelo WhatsApp.`,
    });
    return;
  }

  if (decision.action === "paid_claim" || decision.action === "handoff") {
    await openAlert(admin, {
      organizationId: org.id,
      customerId: customer.id,
      runId,
      kind: decision.action === "paid_claim" ? "paid_claim" : "needs_human",
      reason: decision.reason,
    });
  }
}

async function openAlert(
  admin: SupabaseClient,
  params: {
    organizationId: string;
    customerId: string;
    runId: string;
    kind: "paid_claim" | "needs_human" | "opt_out";
    reason: string;
  }
): Promise<void> {
  await admin.from("assistant_alerts").insert({
    organization_id: params.organizationId,
    customer_id: params.customerId,
    run_id: params.runId,
    kind: params.kind,
    reason: params.reason,
  });
  await notifyOwners(admin, params.organizationId, params.customerId, params.reason);
}

async function notifyOwners(admin: SupabaseClient, organizationId: string, customerId: string, reason: string): Promise<void> {
  const [{ data: owners }, { data: customer }] = await Promise.all([
    admin.from("memberships").select("user_id").eq("organization_id", organizationId).eq("role", "owner").eq("status", "active"),
    admin.from("customers").select("name").eq("id", customerId).maybeSingle(),
  ]);

  for (const owner of owners ?? []) {
    const { data } = await admin.auth.admin.getUserById(owner.user_id);
    const email = data.user?.email;
    if (!email) continue;
    const { subject, html } = assistantAlertEmail({ customerName: customer?.name ?? "Um cliente", reason, customerId });
    await sendEmail({ to: email, subject, html });
  }
}
