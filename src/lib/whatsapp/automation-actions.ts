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

// The cron runs once a day between 09:00 and 10:00 (America/Sao_Paulo), so a
// custom send window could only ever block messages for good. Rules keep the
// wide default window; the form no longer asks for it.
const DEFAULT_SEND_WINDOW = { send_window_start: "08:00", send_window_end: "20:00" };

type RuleFields = {
  trigger_type: string;
  days_offset: number | null;
  template_id: string;
  skip_sunday: boolean;
};

function parseRuleForm(formData: FormData): { error: string } | { fields: RuleFields } {
  const triggerType = String(formData.get("triggerType") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const daysOffsetRaw = String(formData.get("daysOffset") ?? "").trim();

  if (!TRIGGER_TYPES.includes(triggerType as (typeof TRIGGER_TYPES)[number])) {
    return { error: "Escolha um tipo de gatilho válido." };
  }
  if (!templateId) return { error: "Escolha um modelo de mensagem." };

  const needsDaysOffset = TRIGGERS_WITH_DAYS_OFFSET.has(triggerType);
  const daysOffset = needsDaysOffset ? parseInt(daysOffsetRaw, 10) : null;
  if (needsDaysOffset && (!Number.isInteger(daysOffset) || (daysOffset as number) <= 0)) {
    return { error: "Informe quantos dias antes/depois esse gatilho dispara." };
  }

  return {
    fields: {
      trigger_type: triggerType,
      days_offset: daysOffset,
      template_id: templateId,
      skip_sunday: formData.get("skipSunday") === "on",
    },
  };
}

const DUPLICATE_RULE_ERROR = "Já existe uma regra igual a essa (mesmo gatilho e mesmos dias).";

export async function createAutomationRuleAction(
  _prev: AutomationRuleActionState,
  formData: FormData
): Promise<AutomationRuleActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem configurar a cobrança automática." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const parsed = parseRuleForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("automation_rules").insert({
    organization_id: membership.organizationId,
    ...parsed.fields,
    ...DEFAULT_SEND_WINDOW,
  });

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_RULE_ERROR };
    return { error: "Não foi possível criar a regra." };
  }

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function updateAutomationRuleAction(
  ruleId: string,
  _prev: AutomationRuleActionState,
  formData: FormData
): Promise<AutomationRuleActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem configurar a cobrança automática." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const parsed = parseRuleForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("automation_rules")
    .update({ ...parsed.fields, ...DEFAULT_SEND_WINDOW })
    .eq("id", ruleId);

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_RULE_ERROR };
    return { error: "Não foi possível salvar a regra." };
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
