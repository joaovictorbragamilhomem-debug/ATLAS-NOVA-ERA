"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";

export type TemplateActionState = { error: string | null };

export async function createMessageTemplateAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem criar modelos de mensagem." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const metaTemplateName = String(formData.get("metaTemplateName") ?? "").trim() || null;
  const metaTemplateLanguage = String(formData.get("metaTemplateLanguage") ?? "pt_BR").trim() || "pt_BR";
  const pixPaymentButton = formData.get("pixPaymentButton") === "on";

  if (!name) return { error: "Dê um nome para o modelo." };
  if (!body) return { error: "Escreva o texto da mensagem." };

  const supabase = await getSupabaseServerClient();
  const { data: template, error } = await supabase
    .from("message_templates")
    .insert({
      organization_id: membership.organizationId,
      name,
      body,
      meta_template_name: metaTemplateName,
      meta_template_language: metaTemplateLanguage,
      pix_payment_button: pixPaymentButton,
    })
    .select("id")
    .single();

  if (error || !template) return { error: "Não foi possível criar o modelo." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "message_template.created",
    entityType: "message_template",
    entityId: template.id,
    after: { name, body },
  });

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function updateMessageTemplateAction(
  templateId: string,
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem editar modelos de mensagem." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const metaTemplateName = String(formData.get("metaTemplateName") ?? "").trim() || null;
  const metaTemplateLanguage = String(formData.get("metaTemplateLanguage") ?? "pt_BR").trim() || "pt_BR";
  const pixPaymentButton = formData.get("pixPaymentButton") === "on";

  if (!name) return { error: "Dê um nome para o modelo." };
  if (!body) return { error: "Escreva o texto da mensagem." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("message_templates")
    .update({
      name,
      body,
      meta_template_name: metaTemplateName,
      meta_template_language: metaTemplateLanguage,
      pix_payment_button: pixPaymentButton,
    })
    .eq("id", templateId);

  if (error) return { error: "Não foi possível salvar o modelo." };

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function deleteMessageTemplateAction(templateId: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem apagar modelos de mensagem." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", templateId);
  if (error) {
    return { error: "Não foi possível apagar — confira se ele não está em uso por alguma regra." };
  }

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function toggleMessageTemplateActiveAction(
  templateId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem alterar modelos de mensagem." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("message_templates").update({ active }).eq("id", templateId);
  if (error) return { error: "Não foi possível atualizar." };

  revalidatePath("/app/whatsapp");
  return { error: null };
}
