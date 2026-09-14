import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CustomerContractSummary = {
  id: string;
  principalAmountCents: number;
  installmentsCount: number;
  periodicity: string;
  status: string;
  createdAt: string;
};

export async function getCustomerWithContracts(customerId: string) {
  const supabase = await getSupabaseServerClient();
  const [{ data: customer }, { data: contracts }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).maybeSingle(),
    supabase
      .from("contracts")
      .select("id, principal_amount_cents, installments_count, periodicity, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ]);

  const contractSummaries: CustomerContractSummary[] = (contracts ?? []).map((c) => ({
    id: c.id,
    principalAmountCents: c.principal_amount_cents,
    installmentsCount: c.installments_count,
    periodicity: c.periodicity,
    status: c.status,
    createdAt: c.created_at,
  }));

  return { customer, contracts: contractSummaries };
}
