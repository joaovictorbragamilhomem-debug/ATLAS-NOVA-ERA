import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import { renderTemplateToPositionalParams } from "@/lib/message-template";
import { getProviderForOrganization } from "@/lib/whatsapp/get-provider-for-organization";
import { fetchInstallmentContext, buildVariables } from "@/lib/whatsapp/enqueue";

const MAX_ATTEMPTS = 3;

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function currentSaoPauloTime(): { hhmm: string; isSunday: boolean } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";

  return { hhmm: `${hour}:${minute}`, isSunday: weekday === "Sun" };
}

// Roda pelo cron, depois do scan: manda de verdade as mensagens que já
// estão na fila e cuja janela de envio (horário + domingo) permite agora.
export async function sendQueuedMessages(): Promise<{ sent: number; failed: number; heldForWindow: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { sent: 0, failed: 0, heldForWindow: 0 };

  const { data: queued } = await admin
    .from("message_queue")
    .select(
      "id, organization_id, customer_id, installment_id, attempts, automation_rules(send_window_start, send_window_end, skip_sunday), message_templates(body, meta_template_name, meta_template_language), customers(whatsapp)"
    )
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for");

  const today = todayInSaoPauloISODate();
  const { hhmm, isSunday } = currentSaoPauloTime();

  let sent = 0;
  let failed = 0;
  let heldForWindow = 0;

  for (const item of queued ?? []) {
    const rule = unwrap(item.automation_rules);
    const template = unwrap(item.message_templates);
    const customer = unwrap(item.customers);

    // Mensagens sem regra (não deveria acontecer, mas por segurança) usam
    // a janela padrão 08:00–20:00 sem pular domingo.
    const windowStart = rule?.send_window_start?.slice(0, 5) ?? "08:00";
    const windowEnd = rule?.send_window_end?.slice(0, 5) ?? "20:00";
    const skipSunday = rule?.skip_sunday ?? true;

    if ((skipSunday && isSunday) || hhmm < windowStart || hhmm > windowEnd) {
      heldForWindow++;
      continue;
    }

    if (!template?.meta_template_name || !customer?.whatsapp) {
      await admin
        .from("message_queue")
        .update({ status: "failed", last_error: "Modelo sem nome aprovado na Meta, ou cliente sem WhatsApp." })
        .eq("id", item.id);
      await admin.from("message_logs").insert({
        organization_id: item.organization_id,
        queue_id: item.id,
        status: "failed",
        error: "Modelo sem nome aprovado na Meta, ou cliente sem WhatsApp.",
      });
      failed++;
      continue;
    }

    const providerInfo = await getProviderForOrganization(item.organization_id);
    if (!providerInfo) {
      await admin
        .from("message_queue")
        .update({ status: "failed", last_error: "WhatsApp não está conectado para essa empresa." })
        .eq("id", item.id);
      failed++;
      continue;
    }

    const ctx = item.installment_id ? await fetchInstallmentContext(admin, item.installment_id) : null;
    const bodyParams = ctx
      ? renderTemplateToPositionalParams(template.body, buildVariables(ctx, today))
      : renderTemplateToPositionalParams(template.body, {});

    const result = await providerInfo.provider.sendTemplateMessage({
      to: customer.whatsapp,
      templateName: template.meta_template_name,
      templateLanguage: template.meta_template_language,
      bodyParams,
    });

    if ("error" in result && result.error) {
      const attempts = (item.attempts ?? 0) + 1;
      const giveUp = attempts >= MAX_ATTEMPTS;
      await admin
        .from("message_queue")
        .update({
          attempts,
          status: giveUp ? "failed" : "scheduled",
          last_error: result.error,
        })
        .eq("id", item.id);
      await admin.from("message_logs").insert({
        organization_id: item.organization_id,
        queue_id: item.id,
        status: "failed",
        error: result.error,
      });
      failed++;
      continue;
    }

    await admin
      .from("message_queue")
      .update({ status: "sent", attempts: (item.attempts ?? 0) + 1, last_error: null })
      .eq("id", item.id);
    await admin.from("message_logs").insert({
      organization_id: item.organization_id,
      queue_id: item.id,
      status: "sent",
      provider_message_id: result.providerMessageId,
    });
    sent++;
  }

  return { sent, failed, heldForWindow };
}
