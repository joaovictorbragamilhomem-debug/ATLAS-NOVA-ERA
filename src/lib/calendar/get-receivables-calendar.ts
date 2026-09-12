import { getSupabaseServerClient } from "@/lib/supabase/server";
import { daysInMonth } from "@/lib/finance/dates";

export type CalendarDayItem = {
  installmentId: string;
  contractId: string;
  customerName: string;
  remainingCents: number;
};

export type CalendarDay = {
  count: number;
  totalCents: number;
  items: CalendarDayItem[];
};

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"];

// Agrupa as parcelas em aberto do mês por dia de vencimento — usado pelo
// calendário de recebimentos (/app/calendario).
export async function getReceivablesCalendar(
  organizationId: string,
  yearMonth: string
): Promise<Map<string, CalendarDay>> {
  const supabase = await getSupabaseServerClient();
  const firstDay = `${yearMonth}-01`;
  const lastDay = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, "0")}`;

  const { data } = await supabase
    .from("installments")
    .select("id, contract_id, due_date, amount_cents, paid_amount_cents, contracts(customers(name))")
    .eq("organization_id", organizationId)
    .in("status", OPEN_STATUSES)
    .gte("due_date", firstDay)
    .lte("due_date", lastDay)
    .order("due_date");

  const byDay = new Map<string, CalendarDay>();

  for (const row of data ?? []) {
    const contract = Array.isArray(row.contracts) ? row.contracts[0] : row.contracts;
    const customer = contract ? (Array.isArray(contract.customers) ? contract.customers[0] : contract.customers) : null;
    if (!customer) continue;

    const remainingCents = Math.max(0, row.amount_cents - row.paid_amount_cents);
    const existing = byDay.get(row.due_date) ?? { count: 0, totalCents: 0, items: [] };
    existing.count += 1;
    existing.totalCents += remainingCents;
    existing.items.push({
      installmentId: row.id,
      contractId: row.contract_id,
      customerName: customer.name,
      remainingCents,
    });
    byDay.set(row.due_date, existing);
  }

  return byDay;
}
