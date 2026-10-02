"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";

export type AssistantActionState = { error: string | null };

// Turning the assistant on or off is the owner's decision (it talks to
// customers in the store's name).
export async function setAssistantEnabledAction(enabled: boolean): Promise<AssistantActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role !== "owner") return { error: "Só o Dono pode ligar ou desligar o assistente." };

  if (enabled) {
    const blocked = await assertOrganizationIsWritable(membership.organizationId);
    if (blocked) return { error: blocked };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { error: "Supabase não está configurado no servidor." };

  const { error } = await admin
    .from("organizations")
    .update({ assistant_enabled: enabled })
    .eq("id", membership.organizationId);
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: enabled ? "assistant.enabled" : "assistant.disabled",
    entityType: "organization",
    entityId: membership.organizationId,
  });

  revalidatePath("/app/whatsapp");
  return { error: null };
}

// "Resolvido": the store handled what the assistant passed on (e.g. checked
// the receipt); the assistant may answer this customer again.
export async function resolveAssistantAlertsAction(customerId: string): Promise<AssistantActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { error: "Supabase não está configurado no servidor." };

  const { error } = await admin
    .from("assistant_alerts")
    .update({ resolved_at: new Date().toISOString(), resolved_by: membership.userId })
    .eq("organization_id", membership.organizationId)
    .eq("customer_id", customerId)
    .is("resolved_at", null);
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath(`/app/conversas/${customerId}`);
  revalidatePath("/app/conversas");
  return { error: null };
}

// The customer asked to receive WhatsApp messages again.
export async function clearCustomerOptOutAction(customerId: string): Promise<AssistantActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem fazer isso." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { error: "Supabase não está configurado no servidor." };

  const { error } = await admin
    .from("customers")
    .update({ whatsapp_opted_out_at: null })
    .eq("organization_id", membership.organizationId)
    .eq("id", customerId);
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  await admin
    .from("assistant_alerts")
    .update({ resolved_at: new Date().toISOString(), resolved_by: membership.userId })
    .eq("organization_id", membership.organizationId)
    .eq("customer_id", customerId)
    .eq("kind", "opt_out")
    .is("resolved_at", null);

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "customer.whatsapp_opt_out_cleared",
    entityType: "customer",
    entityId: customerId,
  });

  revalidatePath(`/app/conversas/${customerId}`);
  return { error: null };
}
