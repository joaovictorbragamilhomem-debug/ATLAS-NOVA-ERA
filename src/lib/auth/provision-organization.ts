import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const TRIAL_DAYS = 7;

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

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: params.organizationName })
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
