import { getSupabaseServerClient } from "@/lib/supabase/server";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import { buildPixPayment, buildVariables, type InstallmentContext } from "@/lib/whatsapp/enqueue";
import { buildChargeMessage, buildWaMeUrl } from "@/lib/whatsapp/charge-message";

export type ChargeLinks = {
  customerName: string;
  reminderUrl: string;
  // The Pix code goes in its own message so the customer can copy it alone —
  // pasting a whole message into the bank app fails.
  pixUrl: string | null;
  pixCode: string | null;
};

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Uses the signed-in user's client, so RLS limits it to their organization.
export async function getChargeLinks(installmentIds: string[]): Promise<Record<string, ChargeLinks>> {
  if (installmentIds.length === 0) return {};

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("installments")
    .select(
      "id, contract_id, due_date, amount_cents, paid_amount_cents, number, contracts(customer_id, installments_count, late_fee_percent, late_interest_monthly_percent, organization_id, customers(id, name, whatsapp), organizations(name, pix_key, pix_city))"
    )
    .in("id", installmentIds);

  const today = todayInSaoPauloISODate();
  const links: Record<string, ChargeLinks> = {};

  for (const row of data ?? []) {
    const contract = unwrap(row.contracts);
    const customer = contract ? unwrap(contract.customers) : null;
    const organization = contract ? unwrap(contract.organizations) : null;
    if (!contract || !customer || !organization || !customer.whatsapp) continue;

    const ctx: InstallmentContext = {
      installmentId: row.id,
      contractId: row.contract_id,
      customerId: customer.id,
      customerName: customer.name,
      organizationId: contract.organization_id,
      organizationName: organization.name,
      pixKey: organization.pix_key,
      pixCity: organization.pix_city,
      dueDate: row.due_date,
      amountCents: row.amount_cents,
      paidAmountCents: row.paid_amount_cents,
      installmentNumber: row.number,
      installmentsCount: contract.installments_count,
      lateFeePercent: contract.late_fee_percent,
      lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
    };

    const pixCode = buildPixPayment(ctx, today)?.code ?? null;
    const message = buildChargeMessage(buildVariables(ctx, today), customer.name, pixCode !== null);

    links[row.id] = {
      customerName: customer.name,
      reminderUrl: buildWaMeUrl(customer.whatsapp, message),
      pixUrl: pixCode ? buildWaMeUrl(customer.whatsapp, pixCode) : null,
      pixCode,
    };
  }

  return links;
}
