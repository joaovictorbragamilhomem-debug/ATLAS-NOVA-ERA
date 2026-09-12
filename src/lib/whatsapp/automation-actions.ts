"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";

export type AutomationRuleActionState = { error: string | null };

const TRIGGER_TYPES = [
  "reminder_before",
  "due_today",
  "overdue_after",
  "renegotiation_offer",
  "payment_confirmation",
  "contract_created",
] as const;

const TRIGGERS_WITH_DAYS_OFFSET = new Set(["reminder_before", "overdue_after", "renegotiation_offer"]);

export async function createAutomationRuleAction(
  _prev: AutomationRuleActionState,
  formData: FormData
): Promise<AutomationRuleActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem configurar a cobrança automática." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const triggerType = String(formData.get("triggerType") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const daysOffsetRaw = String(formData.get("daysOffset") ?? "").trim();
  const sendWindowStart = String(formData.get("sendWindowStart") ?? "08:00");
  const sendWindowEnd = String(formData.get("sendWindowEnd") ?? "20:00");
  const skipSunday = formData.get("skipSunday") === "on";

  if (!TRIGGER_TYPES.includes(triggerType as (typeof TRIGGER_TYPES)[number])) {
    return { error: "Escolha um tipo de gatilho válido." };
  }
  if (!templateId) return { error: "Escolha um modelo de mensagem." };

  const needsDaysOffset = TRIGGERS_WITH_DAYS_OFFSET.has(triggerType);
  const daysOffset = needsDaysOffset ? parseInt(daysOffsetRaw, 10) : null;
  if (needsDaysOffset && (!Number.isInteger(daysOffset) || (daysOffset as number) <= 0)) {
    return { error: "Informe quantos dias antes/depois esse gatilho dispara." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("automation_rules").insert({
    organization_id: membership.organizationId,
    trigger_type: triggerType,
    days_offset: daysOffset,
    template_id: templateId,
    send_window_start: sendWindowStart,
    send_window_end: sendWindowEnd,
    skip_sunday: skipSunday,
  });

  if (error) {
    if (error.code === "23505") return { error: "Já existe uma regra igual a essa (mesmo gatilho e mesmos dias)." };
    return { error: "Não foi possível criar a regra." };
  }

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function toggleAutomationRuleActiveAction(
  ruleId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem configurar a cobrança automática." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("automation_rules").update({ active }).eq("id", ruleId);
  if (error) return { error: "Não foi possível atualizar." };

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function deleteAutomationRuleAction(ruleId: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem configurar a cobrança automática." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("automation_rules").delete().eq("id", ruleId);
  if (error) return { error: "Não foi possível apagar a regra." };

  revalidatePath("/app/whatsapp");
  return { error: null };
}
