import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { buildCSV } from "@/lib/reports/csv";
import { formatCentsToBRL } from "@/lib/masks";
import {
  getCustomersForExport,
  getContractsForExport,
  getInstallmentsForExport,
  getPaymentsForExport,
} from "@/lib/reports/get-full-export";

const PERIODICITY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  completed: "Concluído",
  renegotiated: "Renegociado",
  canceled: "Cancelado",
};

const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  partially_paid: "Parcialmente paga",
  paid: "Paga",
  renegotiated: "Renegociada",
  reversed: "Estornada",
};

const METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
};

const TABLES = ["clientes", "contratos", "parcelas", "pagamentos"] as const;
type Table = (typeof TABLES)[number];

function formatDateBR(isoDateOrTimestamp: string): string {
  return new Date(isoDateOrTimestamp).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function buildCsvForTable(table: Table, organizationId: string): Promise<string> {
  if (table === "clientes") {
    const rows = await getCustomersForExport(organizationId);
    return buildCSV(
      ["Nome", "CPF", "WhatsApp", "Email", "CEP", "Endereço", "Número", "Complemento", "Bairro", "Cidade", "UF", "Tags", "Cadastrado em"],
      rows.map((row) => [
        row.name,
        row.cpf,
        row.whatsapp,
        row.email ?? "",
        row.cep ?? "",
        row.addressStreet ?? "",
        row.addressNumber ?? "",
        row.addressComplement ?? "",
        row.addressDistrict ?? "",
        row.addressCity ?? "",
        row.addressState ?? "",
        (row.tags ?? []).join("; "),
        formatDateBR(row.createdAt),
      ])
    );
  }

  if (table === "contratos") {
    const rows = await getContractsForExport(organizationId);
    return buildCSV(
      ["Cliente", "Valor total", "Nº de parcelas", "Periodicidade", "1º vencimento", "Valor da parcela", "Multa %", "Juros de mora % a.m.", "Status", "Criado em"],
      rows.map((row) => [
        row.customerName,
        formatCentsToBRL(row.principalAmountCents),
        String(row.installmentsCount),
        PERIODICITY_LABEL[row.periodicity] ?? row.periodicity,
        formatDateBR(row.firstDueDate),
        formatCentsToBRL(row.installmentAmountCents),
        String(row.lateFeePercent),
        String(row.lateInterestMonthlyPercent),
        CONTRACT_STATUS_LABEL[row.status] ?? row.status,
        formatDateBR(row.createdAt),
      ])
    );
  }

  if (table === "parcelas") {
    const rows = await getInstallmentsForExport(organizationId);
    return buildCSV(
      ["Cliente", "Parcela", "Vencimento", "Valor", "Valor pago", "Status"],
      rows.map((row) => [
        row.customerName,
        String(row.number),
        formatDateBR(row.dueDate),
        formatCentsToBRL(row.amountCents),
        formatCentsToBRL(row.paidAmountCents),
        INSTALLMENT_STATUS_LABEL[row.status] ?? row.status,
      ])
    );
  }

  const rows = await getPaymentsForExport(organizationId);
  return buildCSV(
    ["Data", "Cliente", "Parcela", "Valor", "Forma de pagamento", "Estornado"],
    rows.map((row) => [
      formatDateBR(row.paidAt),
      row.customerName,
      String(row.installmentNumber),
      formatCentsToBRL(row.amountCents),
      METHOD_LABEL[row.method] ?? row.method,
      row.reversed ? "Sim" : "Não",
    ])
  );
}

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("tabela") as Table | null;
  if (!table || !TABLES.includes(table)) {
    return NextResponse.json({ error: "invalid tabela" }, { status: 400 });
  }

  const csv = await buildCsvForTable(table, membership.organizationId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${table}.csv"`,
    },
  });
}
