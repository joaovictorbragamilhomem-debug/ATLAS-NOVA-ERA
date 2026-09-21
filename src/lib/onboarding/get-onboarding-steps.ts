import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildOnboardingSteps, type OnboardingRole, type OnboardingStep } from "./build-onboarding-steps";

export async function getOnboardingSteps(organizationId: string, role: OnboardingRole): Promise<OnboardingStep[]> {
  const supabase = await getSupabaseServerClient();

  const [{ data: customer }, { data: contract }, { data: connection }] = await Promise.all([
    supabase.from("customers").select("id").eq("organization_id", organizationId).limit(1).maybeSingle(),
    supabase.from("contracts").select("id").eq("organization_id", organizationId).limit(1).maybeSingle(),
    supabase.from("whatsapp_connections").select("status").eq("organization_id", organizationId).maybeSingle(),
  ]);

  return buildOnboardingSteps({
    role,
    firstCustomerId: customer?.id ?? null,
    hasContract: contract !== null,
    whatsappConnected: connection?.status === "connected",
  });
}
