import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SubscriptionInfo = {
  plan: "monthly" | "annual" | "lifetime";
  status: "trialing" | "active" | "past_due" | "canceled" | "lifetime";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isReadOnly: boolean;
  trialDaysLeft: number | null;
};

// "Somente leitura" = teste acabou sem assinatura ativa, ou pagamento
// atrasado. Nunca apaga dado nenhum — só bloqueia criar/editar.
export async function getSubscriptionStatus(organizationId: string): Promise<SubscriptionInfo | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_ends_at, current_period_end")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;

  const now = Date.now();
  const trialEndsAt = data.trial_ends_at as string | null;
  const trialExpired = data.status === "trialing" && trialEndsAt !== null && new Date(trialEndsAt).getTime() < now;

  const trialDaysLeft =
    data.status === "trialing" && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000)))
      : null;

  return {
    plan: data.plan,
    status: data.status,
    trialEndsAt,
    currentPeriodEnd: data.current_period_end,
    isReadOnly: data.status === "past_due" || trialExpired,
    trialDaysLeft,
  };
}
