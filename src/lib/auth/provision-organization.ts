import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/intake/slugify";

const TRIAL_DAYS = 7;

// Tenta o slug "limpo" primeiro; se já existir (nome de empresa repetido),
// acrescenta um sufixo curto e tenta de novo, algumas vezes.
async function generateUniqueIntakeSlug(
  supabase: SupabaseClient,
  organizationName: string
): Promise<string | null> {
  const base = slugify(organizationName) || "empresa";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabase.from("organizations").select("id").eq("intake_slug", candidate).maybeSingle();
    if (!data) return candidate;
  }

  return null;
}

// Roda logo depois do supabase.auth.signUp(): cria a organização, o
// primeiro vínculo (dono) e a assinatura em teste — tudo de uma vez, com o
// cliente admin, porque ainda não existe nenhum "owner" que passe pela RLS
// normal de memberships.
export async function provisionOrganizationForNewUser(params: {
  userId: string;
  organizationName: string;
}): Promise<{ organizationId: string } | { error: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Supabase não está configurado no servidor." };

  const intakeSlug = await generateUniqueIntakeSlug(supabase, params.organizationName);

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: params.organizationName, intake_slug: intakeSlug })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? "Não foi possível criar a organização." };
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    organization_id: org.id,
    user_id: params.userId,
    role: "owner",
    status: "active",
  });

  if (membershipError) {
    return { error: membershipError.message };
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    organization_id: org.id,
    plan: "monthly",
    status: "trialing",
    trial_ends_at: trialEndsAt,
  });

  if (subscriptionError) {
    return { error: subscriptionError.message };
  }

  return { organizationId: org.id };
}
