import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { getPaymentsReport } from "@/lib/reports/get-payments-report";
import { buildCSV } from "@/lib/reports/csv";
import { formatCentsToBRL } from "@/lib/masks";

const METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
};

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("de") ?? "";
  const to = searchParams.get("ate") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "invalid date range" }, { status: 400 });
  }

  const report = await getPaymentsReport(membership.organizationId, from, to);

  const csv = buildCSV(
    ["Data", "Cliente", "Parcela", "Valor", "Forma de pagamento", "Estornado"],
    report.rows.map((row) => [
      new Date(row.paidAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      row.customerName,
      String(row.installmentNumber),
      formatCentsToBRL(row.amountCents),
      METHOD_LABEL[row.method] ?? row.method,
      row.reversed ? "Sim" : "Não",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="extrato-${from}-a-${to}.csv"`,
    },
  });
}
