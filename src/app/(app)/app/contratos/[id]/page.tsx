import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { formatCentsToBRL } from "@/lib/masks"
import { todayInSaoPauloISODate } from "@/lib/finance/dates"
import { InstallmentsList } from "./_components/installments-list"

const PERIODICITY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
}

export default async function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

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

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-sm text-muted-foreground">
          Cliente:{" "}
          <Link href={`/app/clientes/${contract.customers.id}`} className="underline underline-offset-2">
            {contract.customers.name}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold">Contrato de {formatCentsToBRL(contract.principal_amount_cents)}</h1>
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
