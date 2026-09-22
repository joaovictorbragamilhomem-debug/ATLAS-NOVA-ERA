import { getSupabaseServerClient } from "@/lib/supabase/server";
import { todayInSaoPauloISODate } from "@/lib/finance/dates";
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount";

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];

export type OpenInstallmentOption = {
  id: string;
  number: number;
  dueDate: string;
  remainingCents: number;
};

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Parcelas em aberto de um cliente, já com multa/juros de hoje aplicados —
// usado pra escolher qual parcela gerar o código Pix na Central de
// conversas.
export async function getOpenInstallmentsForCustomer(customerId: string): Promise<OpenInstallmentOption[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("installments")
    .select(
      "id, number, due_date, amount_cents, paid_amount_cents, status, contracts!inner(customer_id, late_fee_percent, late_interest_monthly_percent)"
    )
    .eq("contracts.customer_id", customerId)
    .in("status", OPEN_STATUSES)
    .order("due_date");

  const today = todayInSaoPauloISODate();

  return (data ?? []).map((row) => {
    const contract = unwrap(row.contracts);
    const updatedAmountCents = calculateUpdatedAmountCents({
      amountCents: row.amount_cents,
      dueDate: row.due_date,
      referenceDate: today,
      lateFeePercent: contract?.late_fee_percent ?? 0,
      lateInterestMonthlyPercent: contract?.late_interest_monthly_percent ?? 0,
    });
    return {
      id: row.id,
      number: row.number,
      dueDate: row.due_date,
      remainingCents: calculateRemainingBalanceCents(updatedAmountCents, row.paid_amount_cents),
    };
  });
}
