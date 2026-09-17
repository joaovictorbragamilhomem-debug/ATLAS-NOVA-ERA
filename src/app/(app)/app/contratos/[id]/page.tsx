import Link from "next/link"
import { notFound } from "next/navigation"
import { RefreshCcwIcon } from "lucide-react"
import { requireMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { formatCentsToBRL } from "@/lib/masks"
import { todayInSaoPauloISODate } from "@/lib/finance/dates"
import { InstallmentsList } from "./_components/installments-list"

const PERIODICITY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
}

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  completed: "Concluído",
  renegotiated: "Renegociado",
  canceled: "Cancelado",
}

const OPEN_INSTALLMENT_STATUSES = ["pending", "partially_paid", "reversed"]

export default async function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await requireMembership()

  const supabase = await getSupabaseServerClient()
  const { data: contract } = await supabase
    .from("contracts")
    .select("*, customers(id, name)")
    .eq("id", id)
    .maybeSingle()

  if (!contract) notFound()

  const { data: installments } = await supabase
    .from("installments")
    .select("*")
    .eq("contract_id", id)
    .order("number")

  const installmentIds = (installments ?? []).map((i) => i.id)
  const { data: payments } =
    installmentIds.length > 0
      ? await supabase.from("payments").select("*").in("installment_id", installmentIds).order("paid_at")
      : { data: [] }

  const totalReceivedCents = (installments ?? []).reduce((sum, i) => sum + i.paid_amount_cents, 0)
  const hasOpenInstallments = (installments ?? []).some((i) => OPEN_INSTALLMENT_STATUSES.includes(i.status))
  const canRenegotiate = membership.role !== "operator" && contract.status === "active" && hasOpenInstallments

  const { data: renegotiatedInto } =
    contract.status === "renegotiated"
      ? await supabase.from("contracts").select("id").eq("renegotiated_from_contract_id", id).maybeSingle()
      : { data: null }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Cliente:{" "}
            <Link href={`/app/clientes/${contract.customers.id}`} className="underline underline-offset-2">
              {contract.customers.name}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">Contrato de {formatCentsToBRL(contract.principal_amount_cents)}</h1>
          <p className="text-sm text-muted-foreground">
            Status: {CONTRACT_STATUS_LABEL[contract.status] ?? contract.status}
            {contract.status === "renegotiated" && renegotiatedInto && (
              <>
                {" — "}
                <Link href={`/app/contratos/${renegotiatedInto.id}`} className="underline underline-offset-2">
                  ver contrato novo
                </Link>
              </>
            )}
          </p>
        </div>
        {canRenegotiate && (
          <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={`/app/contratos/${id}/renegociar`} />}>
            <RefreshCcwIcon /> Renegociar
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Parcelas</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {contract.installments_count}x {PERIODICITY_LABEL[contract.periodicity]}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Já recebido</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatCentsToBRL(totalReceivedCents)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Multa / juros de mora</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {contract.late_fee_percent}% + {contract.late_interest_monthly_percent}%/mês
          </p>
        </div>
      </div>

      {contract.notes && <p className="text-sm text-muted-foreground">{contract.notes}</p>}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Carnê</h2>
        <InstallmentsList
          contract={{
            id: contract.id,
            lateFeePercent: contract.late_fee_percent,
            lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
          }}
          installments={installments ?? []}
          payments={payments ?? []}
          todayISODate={todayInSaoPauloISODate()}
          canReverse={membership.role !== "operator"}
        />
      </div>
    </main>
  )
}
