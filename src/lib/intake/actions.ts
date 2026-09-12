"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { isValidCPF } from "@/lib/validators";
import { onlyDigits, phoneDigitsToE164BR } from "@/lib/masks";
import { slugify } from "@/lib/intake/slugify";

export type IntakeFormActionState = { error: string | null; success?: boolean };

// Ainda não temos um texto de termos publicado de verdade (ver /termos,
// que está com TODO) — esse identificador só marca "qual edição do
// consentimento" foi aceita, para quando o texto real existir.
const TERMS_VERSION = "v1-provisorio";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

export async function submitIntakeFormAction(
  slug: string,
  _prev: IntakeFormActionState,
  formData: FormData
): Promise<IntakeFormActionState> {
  // Campo-armadilha: invisível para gente, mas bots de spam costumam
  // preencher todo campo que encontram. Se vier preenchido, finge sucesso
  // sem gravar nada — não vale a pena avisar o bot que foi bloqueado.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { error: null, success: true };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { error: "Não foi possível enviar. Tente novamente mais tarde." };

  const { data: org } = await admin.from("organizations").select("id").eq("intake_slug", slug).maybeSingle();
  if (!org) return { error: "Link inválido." };

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("intake_forms")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return { error: "Muitos envios seguidos. Espere um minuto e tente de novo." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const cpf = onlyDigits(String(formData.get("cpf") ?? ""));
  const whatsappDigits = onlyDigits(String(formData.get("whatsapp") ?? ""));
  const email = String(formData.get("email") ?? "").trim() || null;
  const cep = onlyDigits(String(formData.get("cep") ?? "")) || null;
  const consentAccepted = formData.get("consent") === "on";

  if (!name) return { error: "Informe seu nome." };
  if (!isValidCPF(cpf)) return { error: "CPF inválido — confira os números." };
  if (whatsappDigits.length < 10) return { error: "Informe um WhatsApp válido, com DDD." };
  if (!consentAccepted) return { error: "É preciso aceitar o uso dos seus dados para enviar a ficha." };

  const fields = {
    organization_id: org.id,
    name,
    cpf,
    whatsapp: phoneDigitsToE164BR(whatsappDigits),
    email,
    cep,
    address_street: String(formData.get("addressStreet") ?? "").trim() || null,
    address_number: String(formData.get("addressNumber") ?? "").trim() || null,
    address_complement: String(formData.get("addressComplement") ?? "").trim() || null,
    address_district: String(formData.get("addressDistrict") ?? "").trim() || null,
    address_city: String(formData.get("addressCity") ?? "").trim() || null,
    address_state: String(formData.get("addressState") ?? "").trim() || null,
  };

  const { data: intakeForm, error } = await admin.from("intake_forms").insert(fields).select("id").single();
  if (error || !intakeForm) return { error: "Não foi possível enviar. Tente novamente." };

  const requestHeaders = await headers();
  await admin.from("consents").insert({
    organization_id: org.id,
    intake_form_id: intakeForm.id,
    terms_version: TERMS_VERSION,
    ip_address: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: requestHeaders.get("user-agent"),
  });

  return { error: null, success: true };
}

export async function approveIntakeFormAction(intakeFormId: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const supabase = await getSupabaseServerClient();

  const { data: intakeForm } = await supabase.from("intake_forms").select("*").eq("id", intakeFormId).maybeSingle();
  if (!intakeForm) return { error: "Ficha não encontrada." };
  if (intakeForm.status !== "received" && intakeForm.status !== "in_review") {
    return { error: "Essa ficha já foi revisada." };
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      organization_id: membership.organizationId,
      name: intakeForm.name,
      cpf: intakeForm.cpf,
      whatsapp: intakeForm.whatsapp,
      email: intakeForm.email,
      cep: intakeForm.cep,
      address_street: intakeForm.address_street,
      address_number: intakeForm.address_number,
      address_complement: intakeForm.address_complement,
      address_district: intakeForm.address_district,
      address_city: intakeForm.address_city,
      address_state: intakeForm.address_state,
      created_by: membership.userId,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    if (customerError?.code === "23505") return { error: "Já existe um cliente com esse CPF nesta conta." };
    return { error: "Não foi possível criar o cliente." };
  }

  const { error: updateError } = await supabase
    .from("intake_forms")
    .update({
      status: "approved",
      customer_id: customer.id,
      reviewed_by: membership.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", intakeFormId);
  if (updateError) return { error: "Cliente criado, mas houve um erro ao atualizar a ficha." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "intake_form.approved",
    entityType: "intake_form",
    entityId: intakeFormId,
    after: { customer_id: customer.id },
  });

  revalidatePath("/app/fichas");
  return { error: null };
}

export async function rejectIntakeFormAction(intakeFormId: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("intake_forms")
    .update({ status: "rejected", reviewed_by: membership.userId, reviewed_at: new Date().toISOString() })
    .eq("id", intakeFormId);
  if (error) return { error: "Não foi possível rejeitar a ficha." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "intake_form.rejected",
    entityType: "intake_form",
    entityId: intakeFormId,
  });

  revalidatePath("/app/fichas");
  return { error: null };
}

export async function updateIntakeSlugAction(rawSlug: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role !== "owner") return { error: "Só o Dono pode alterar o link de cadastro." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const slug = slugify(rawSlug);
  if (!slug) return { error: "Informe um link válido." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("organizations")
    .update({ intake_slug: slug })
    .eq("id", membership.organizationId);

  if (error) {
    if (error.code === "23505") return { error: "Esse link já está em uso. Escolha outro." };
    return { error: "Não foi possível salvar o link." };
  }

  revalidatePath("/app/fichas");
  return { error: null };
}
