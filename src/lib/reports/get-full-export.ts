import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CustomerExportRow = {
  name: string;
  cpf: string;
  whatsapp: string;
  email: string | null;
  cep: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  tags: string[] | null;
  createdAt: string;
};

// Todos os clientes da organização — sem filtro de data, é exportação completa.
export async function getCustomersForExport(organizationId: string): Promise<CustomerExportRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("customers")
    .select(
      "name, cpf, whatsapp, email, cep, address_street, address_number, address_complement, address_district, address_city, address_state, tags, created_at"
    )
    .eq("organization_id", organizationId)
    .order("name");

  return (data ?? []).map((row) => ({
    name: row.name,
    cpf: row.cpf,
    whatsapp: row.whatsapp,
    email: row.email,
    cep: row.cep,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressDistrict: row.address_district,
    addressCity: row.address_city,
    addressState: row.address_state,
    tags: row.tags,
    createdAt: row.created_at,
  }));
}

export type ContractExportRow = {
  customerName: string;
  principalAmountCents: number;
  installmentsCount: number;
  periodicity: string;
  firstDueDate: string;
  installmentAmountCents: number;
  lateFeePercent: number;
  lateInterestMonthlyPercent: number;
  status: string;
  createdAt: string;
};

export async function getContractsForExport(organizationId: string): Promise<ContractExportRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("contracts")
    .select(
      "principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents, late_fee_percent, late_interest_monthly_percent, status, created_at, customers(name)"
    )
    .eq("organization_id", organizationId)
    .order("created_at");

  return (data ?? []).flatMap((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    if (!customer) return [];
    return [
      {
        customerName: customer.name,
        principalAmountCents: row.principal_amount_cents,
        installmentsCount: row.installments_count,
        periodicity: row.periodicity,
        firstDueDate: row.first_due_date,
        installmentAmountCents: row.installment_amount_cents,
        lateFeePercent: row.late_fee_percent,
        lateInterestMonthlyPercent: row.late_interest_monthly_percent,
        status: row.status,
        createdAt: row.created_at,
      },
    ];
  });
}

export type InstallmentExportRow = {
  customerName: string;
  number: number;
  dueDate: string;
  amountCents: number;
  paidAmountCents: number;
  status: string;
};

export async function getInstallmentsForExport(organizationId: string): Promise<InstallmentExportRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("installments")
    .select("number, due_date, amount_cents, paid_amount_cents, status, contracts(customers(name))")
    .eq("organization_id", organizationId)
    .order("due_date");

  return (data ?? []).flatMap((row) => {
    const contract = Array.isArray(row.contracts) ? row.contracts[0] : row.contracts;
    const customer = contract ? (Array.isArray(contract.customers) ? contract.customers[0] : contract.customers) : null;
    if (!customer) return [];
    return [
      {
        customerName: customer.name,
        number: row.number,
        dueDate: row.due_date,
        amountCents: row.amount_cents,
        paidAmountCents: row.paid_amount_cents,
        status: row.status,
      },
    ];
  });
}

export type FullExportPaymentRow = {
  customerName: string;
  installmentNumber: number;
  amountCents: number;
  paidAt: string;
  method: string;
  reversed: boolean;
};

// Todos os pagamentos da organização, sem filtro de período — diferente de
// getPaymentsReport (usado no extrato por período da tela de Relatórios).
export async function getPaymentsForExport(organizationId: string): Promise<FullExportPaymentRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("payments")
    .select("amount_cents, paid_at, method, reversed_at, installments(number, contracts(customers(name)))")
    .eq("organization_id", organizationId)
    .order("paid_at");

  return (data ?? []).flatMap((row) => {
    const installment = Array.isArray(row.installments) ? row.installments[0] : row.installments;
    if (!installment) return [];
    const contract = Array.isArray(installment.contracts) ? installment.contracts[0] : installment.contracts;
    if (!contract) return [];
    const customer = Array.isArray(contract.customers) ? contract.customers[0] : contract.customers;
    if (!customer) return [];
    return [
      {
        customerName: customer.name,
        installmentNumber: installment.number,
        amountCents: row.amount_cents,
        paidAt: row.paid_at,
        method: row.method,
        reversed: Boolean(row.reversed_at),
      },
    ];
  });
}
