import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AssistantAlert = {
  id: string;
  kind: "paid_claim" | "needs_human" | "opt_out";
  reason: string;
  createdAt: string;
};

export type AssistantConversationState = {
  openAlerts: AssistantAlert[];
  optedOutAt: string | null;
};

// What the conversation screen shows about the collections assistant for
// one customer (read with the signed-in user's permissions).
export async function getAssistantConversationState(
  organizationId: string,
  customerId: string
): Promise<AssistantConversationState> {
  const supabase = await getSupabaseServerClient();

  const [{ data: alerts }, { data: customer }] = await Promise.all([
    supabase
      .from("assistant_alerts")
      .select("id, kind, reason, created_at")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .is("resolved_at", null)
      .order("created_at"),
    supabase.from("customers").select("whatsapp_opted_out_at").eq("id", customerId).maybeSingle(),
  ]);

  return {
    openAlerts: (alerts ?? []).map((a) => ({
      id: a.id,
      kind: a.kind as AssistantAlert["kind"],
      reason: a.reason,
      createdAt: a.created_at,
    })),
    optedOutAt: customer?.whatsapp_opted_out_at ?? null,
  };
}
