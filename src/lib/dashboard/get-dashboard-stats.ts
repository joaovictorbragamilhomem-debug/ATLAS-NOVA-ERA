import { getSupabaseServerClient } from "@/lib/supabase/server";
import { toSaoPauloISODate, todayInSaoPauloISODate } from "@/lib/finance/dates";
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount";

export type UpcomingInstallment = {
  installmentId: string;
  installmentNumber: number;
  contractId: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  remainingCents: number;
};

export type OverdueInstallment = UpcomingInstallment & {
  daysLate: number;
  updatedAmountCents: number;
};

export type DashboardStats = {
  receivableThisMonthCents: number;
  receivedThisMonthCents: number;
  overdueCents: number;
  activePortfolioCents: number;
  upcoming: UpcomingInstallment[];
  biggestOverdue: OverdueInstallment[];
};

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await getSupabaseServerClient();
  const today = todayInSaoPauloISODate();
  const currentYearMonth = today.slice(0, 7);

  const { data: openInstallments } = await supabase
    .from("installments")
    .select(
      "id, number, contract_id, due_date, amount_cents, paid_amount_cents, contracts(customer_id, late_fee_percent, late_interest_monthly_percent, customers(id, name))"
    )
    .eq("organization_id", organizationId)
    .in("status", OPEN_STATUSES);

  const { data: paymentsThisMonth } = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("organization_id", organizationId)
    .is("reversed_at", null);

  const receivedThisMonthCents = (paymentsThisMonth ?? [])
    .filter((p) => toSaoPauloISODate(new Date(p.paid_at)).slice(0, 7) === currentYearMonth)
    .reduce((sum, p) => sum + p.amount_cents, 0);

  let receivableThisMonthCents = 0;
  let overdueCents = 0;
  let activePortfolioCents = 0;
  const upcoming: UpcomingInstallment[] = [];
  const overdueList: OverdueInstallment[] = [];

  for (const row of openInstallments ?? []) {
    const contract = Array.isArray(row.contracts) ? row.contracts[0] : row.contracts;
    if (!contract) continue;
    const customer = Array.isArray(contract.customers) ? contract.customers[0] : contract.customers;
    if (!customer) continue;

    const remainingCents = Math.max(0, row.amount_cents - row.paid_amount_cents);
    activePortfolioCents += remainingCents;

    if (row.due_date.slice(0, 7) === currentYearMonth) {
      receivableThisMonthCents += remainingCents;
    }

    const item: UpcomingInstallment = {
      installmentId: row.id,
      installmentNumber: row.number,
      contractId: row.contract_id,
      customerId: customer.id,
      customerName: customer.name,
      dueDate: row.due_date,
      remainingCents,
    };

    if (row.due_date < today) {
      const updatedAmountCents = calculateUpdatedAmountCents({
        amountCents: row.amount_cents,
        dueDate: row.due_date,
        referenceDate: today,
        lateFeePercent: contract.late_fee_percent,
        lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
      });
      const updatedRemainingCents = calculateRemainingBalanceCents(updatedAmountCents, row.paid_amount_cents);
      overdueCents += updatedRemainingCents;
      overdueList.push({
        ...item,
        remainingCents: updatedRemainingCents,
        updatedAmountCents,
        daysLate: Math.round(
          (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${row.due_date}T00:00:00Z`)) / (24 * 60 * 60 * 1000)
        ),
      });
    } else {
      upcoming.push(item);
    }
  }

  upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
  overdueList.sort((a, b) => b.remainingCents - a.remainingCents);

  return {
    receivableThisMonthCents,
    receivedThisMonthCents,
    overdueCents,
    activePortfolioCents,
    upcoming: upcoming.slice(0, 8),
    biggestOverdue: overdueList.slice(0, 8),
  };
}
