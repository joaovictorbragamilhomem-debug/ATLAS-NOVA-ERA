import { notFound, redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { renegotiateContractAction, type ContractActionState } from "@/lib/contracts/actions"
import { todayInSaoPauloISODate } from "@/lib/finance/dates"
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount"
import { formatCentsToBRL } from "@/lib/masks"
import { ContractForm } from "../../../clientes/[id]/contratos/_components/contract-form"

const OPEN_STATUSES = ["pending", "partially_paid", "reversed"]

export default async function RenegociarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")
  if (membership.role === "operator") redirect(`/app/contratos/${id}`)

  const supabase = await getSupabaseServerClient()

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, customers(id, name), late_fee_percent, late_interest_monthly_percent")
    .eq("id", id)
    .maybeSingle()
  if (!contract) notFound()

  const customer = Array.isArray(contract.customers) ? contract.customers[0] : contract.customers
  if (!customer) notFound()

  if (contract.status !== "active") {
    redirect(`/app/contratos/${id}`)
  }

  const { data: openInstallments } = await supabase
    .from("installments")
    .select("due_date, amount_cents, paid_amount_cents")
    .eq("contract_id", id)
    .in("status", OPEN_STATUSES)

  if (!openInstallments || openInstallments.length === 0) {
    redirect(`/app/contratos/${id}`)
  }

  const today = todayInSaoPauloISODate()
  const suggestedPrincipalCents = openInstallments.reduce((sum, installment) => {
    const updatedAmountCents = calculateUpdatedAmountCents({
      amountCents: installment.amount_cents,
      dueDate: installment.due_date,
      referenceDate: today,
      lateFeePercent: contract.late_fee_percent,
      lateInterestMonthlyPercent: contract.late_interest_monthly_percent,
    })
    return sum + calculateRemainingBalanceCents(updatedAmountCents, installment.paid_amount_cents)
  }, 0)

  const boundAction = renegotiateContractAction.bind(null, id) as (
    state: ContractActionState,
    formData: FormData
  ) => Promise<ContractActionState>

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Renegociar contrato</h1>
        <p className="text-sm text-muted-foreground">Cliente: {customer.name}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="text-muted-foreground">
          As {openInstallments.length} parcela(s) em aberto desse contrato somam, com multa e juros de hoje,{" "}
          <span className="font-medium text-foreground">{formatCentsToBRL(suggestedPrincipalCents)}</span>. Esse
          valor já veio sugerido abaixo — pode ajustar antes de confirmar.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Ao confirmar, um contrato novo é criado com essas condições, e as parcelas em aberto do contrato antigo
          ficam marcadas como &ldquo;Renegociada&rdquo;.
        </p>
      </div>

      <ContractForm
        action={boundAction}
        initialPrincipalAmountCents={suggestedPrincipalCents}
        submitLabel="Confirmar renegociação"
      />
    </main>
  )
}
