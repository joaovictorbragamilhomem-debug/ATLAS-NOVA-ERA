import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSubscriptionStatus } from "@/lib/auth/subscription-status"
import { signOutAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats"
import { formatCentsToBRL, formatISODateToBR } from "@/lib/masks"
import { CalendarCheck2Icon } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  manager: "Gestor",
  operator: "Operador",
}

export default async function AppHomePage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const subscription = await getSubscriptionStatus(membership.organizationId)
  const stats = await getDashboardStats(membership.organizationId)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{membership.organizationName}</h1>
          <p className="text-sm text-muted-foreground">
            {membership.email} · {ROLE_LABEL[membership.role]}
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Sair
          </Button>
        </form>
      </header>

      {subscription?.isReadOnly && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-[#FEF3C7] px-4 py-3 text-sm text-[#B45309] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {subscription.status === "past_due"
              ? "O pagamento da sua assinatura não foi confirmado."
              : "Seu teste grátis terminou."}{" "}
            Você ainda vê tudo, mas não consegue criar nem editar nada até assinar.
          </span>
          <Button size="sm" nativeButton={false} render={<Link href="/app/assinatura" />}>
            Assinar
          </Button>
        </div>
      )}

      {subscription?.status === "trialing" && !subscription.isReadOnly && (
        <p className="text-sm text-muted-foreground">
          Teste grátis: {subscription.trialDaysLeft} dia(s) restante(s).{" "}
          <Link href="/app/assinatura" className="font-medium text-foreground underline-offset-4 hover:underline">
            Ver planos
          </Link>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">A receber no mês</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCentsToBRL(stats.receivableThisMonthCents)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recebido no mês</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCentsToBRL(stats.receivedThisMonthCents)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Em atraso</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[#B91C1C]">
            {formatCentsToBRL(stats.overdueCents)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Carteira ativa</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCentsToBRL(stats.activePortfolioCents)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Próximos vencimentos</h2>
          {stats.upcoming.length === 0 ? (
            <EmptyState icon={CalendarCheck2Icon} title="Nada vencendo em breve" />
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.upcoming.map((item) => (
                <li key={item.installmentId}>
                  <Link
                    href={`/app/contratos/${item.contractId}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.customerName}</span>
                      <span className="text-xs text-muted-foreground">{formatISODateToBR(item.dueDate)}</span>
                    </div>
                    <span className="font-medium tabular-nums">{formatCentsToBRL(item.remainingCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Maiores atrasos</h2>
          {stats.biggestOverdue.length === 0 ? (
            <EmptyState icon={CalendarCheck2Icon} title="Nenhuma parcela atrasada" />
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.biggestOverdue.map((item) => (
                <li key={item.installmentId}>
                  <Link
                    href={`/app/contratos/${item.contractId}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.customerName}</span>
                      <span className="text-xs text-[#B91C1C]">{item.daysLate} dia(s) de atraso</span>
                    </div>
                    <span className="font-medium tabular-nums">{formatCentsToBRL(item.remainingCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
