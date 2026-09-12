import Link from "next/link"
import { redirect } from "next/navigation"
import { DownloadIcon, FileBarChart2Icon } from "lucide-react"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getPaymentsReport } from "@/lib/reports/get-payments-report"
import { todayInSaoPauloISODate } from "@/lib/finance/dates"
import { formatCentsToBRL } from "@/lib/masks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/empty-state"
import { PrintButton } from "./_components/print-button"

const METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
}

function firstDayOfCurrentMonth(today: string): string {
  return `${today.slice(0, 7)}-01`
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>
}) {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const { de, ate } = await searchParams
  const today = todayInSaoPauloISODate()
  const from = de && /^\d{4}-\d{2}-\d{2}$/.test(de) ? de : firstDayOfCurrentMonth(today)
  const to = ate && /^\d{4}-\d{2}-\d{2}$/.test(ate) ? ate : today

  const report = await getPaymentsReport(membership.organizationId, from, to)

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 print:hidden">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="de">De</Label>
          <Input id="de" name="de" type="date" defaultValue={from} className="w-auto" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" name="ate" type="date" defaultValue={to} className="w-auto" />
        </div>
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          nativeButton={false}
          render={<Link href={`/api/reports/payments-csv?de=${from}&ate=${to}`} />}
        >
          <DownloadIcon /> Exportar CSV
        </Button>
        <PrintButton />
      </form>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Total recebido no período</p>
        <p className="mt-1 text-lg font-semibold tabular-nums">{formatCentsToBRL(report.totalReceivedCents)}</p>
      </div>

      {report.rows.length === 0 ? (
        <EmptyState icon={FileBarChart2Icon} title="Nenhum pagamento nesse período" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Parcela</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 font-medium">Forma</th>
                <th className="px-3 py-2 font-medium">Estornado</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.paymentId} className={`border-t border-border ${row.reversed ? "text-muted-foreground line-through" : ""}`}>
                  <td className="px-3 py-2">
                    {new Date(row.paidAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/app/contratos/${row.contractId}`}
                      className="underline-offset-2 hover:underline print:no-underline"
                    >
                      {row.customerName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">#{row.installmentNumber}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCentsToBRL(row.amountCents)}</td>
                  <td className="px-3 py-2">{METHOD_LABEL[row.method] ?? row.method}</td>
                  <td className="px-3 py-2">{row.reversed ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
