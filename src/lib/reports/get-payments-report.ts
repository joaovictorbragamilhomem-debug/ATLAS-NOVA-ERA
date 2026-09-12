import { getSupabaseServerClient } from "@/lib/supabase/server";
import { addDaysToISODate } from "@/lib/finance/dates";

export type PaymentReportRow = {
  paymentId: string;
  paidAt: string; // timestamptz ISO
  customerName: string;
  contractId: string;
  installmentNumber: number;
  amountCents: number;
  method: "pix" | "dinheiro" | "transferencia" | "cartao";
  reversed: boolean;
};

export type PaymentsReport = {
  rows: PaymentReportRow[];
  totalReceivedCents: number;
};

// Brasil não observa horário de verão desde 2019 — America/Sao_Paulo é
// sempre UTC-3 o ano inteiro, então dá para usar esse offset fixo em vez de
// depender de conversão de fuso horário para montar os limites da consulta.
function saoPauloStartOfDayUTCInstant(isoDate: string): string {
  return `${isoDate}T00:00:00-03:00`;
}

export async function getPaymentsReport(
  organizationId: string,
  fromISODate: string,
  toISODate: string
): Promise<PaymentsReport> {
  const supabase = await getSupabaseServerClient();

  const fromInstant = saoPauloStartOfDayUTCInstant(fromISODate);
  const toInstantExclusive = saoPauloStartOfDayUTCInstant(addDaysToISODate(toISODate, 1));

  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount_cents, paid_at, method, reversed_at, installments(number, contract_id, contracts(customers(name)))"
    )
    .eq("organization_id", organizationId)
    .gte("paid_at", fromInstant)
    .lt("paid_at", toInstantExclusive)
    .order("paid_at");

  const rows: PaymentReportRow[] = [];
  let totalReceivedCents = 0;

  for (const row of data ?? []) {
    const installment = Array.isArray(row.installments) ? row.installments[0] : row.installments;
    if (!installment) continue;
    const contract = Array.isArray(installment.contracts) ? installment.contracts[0] : installment.contracts;
    if (!contract) continue;
    const customer = Array.isArray(contract.customers) ? contract.customers[0] : contract.customers;
    if (!customer) continue;

    const reversed = Boolean(row.reversed_at);
    if (!reversed) totalReceivedCents += row.amount_cents;

    rows.push({
      paymentId: row.id,
      paidAt: row.paid_at,
      customerName: customer.name,
      contractId: installment.contract_id,
      installmentNumber: installment.number,
      amountCents: row.amount_cents,
      method: row.method,
      reversed,
    });
  }

  return { rows, totalReceivedCents };
}
