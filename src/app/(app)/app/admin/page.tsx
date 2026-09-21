import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/admin/is-super-admin"
import { getAccountsOverview } from "@/lib/admin/get-accounts-overview"
import { getActivationFunnel } from "@/lib/admin/get-activation-funnel"
import { getLifetimeSeatsRemaining } from "@/lib/lifetime-seats"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCentsToBRL } from "@/lib/masks"
import { AccountActions } from "./_components/account-actions"
import { ActivationFunnel } from "./_components/activation-funnel"

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Atrasada",
  canceled: "Cancelada",
  lifetime: "Vitalícia",
}

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/app/entrar")
  if (!isSuperAdmin(user.email)) redirect("/app")

  const [{ accounts, mrrCents, trialsEndingSoon }, lifetimeSeatsRemaining, activationStages] = await Promise.all([
    getAccountsOverview(),
    getLifetimeSeatsRemaining(),
    getActivationFunnel(),
  ])

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Painel do dono da plataforma</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Faturamento mensal recorrente</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {mrrCents !== null ? formatCentsToBRL(mrrCents) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Testes terminando (2 dias)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{trialsEndingSoon.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vagas restantes — Vitalício</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{lifetimeSeatsRemaining ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {activationStages && <ActivationFunnel stages={activationStages} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Contas</h2>
        {accounts.map((account) => (
          <div key={account.organizationId} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{account.organizationName}</span>
              <span className="text-sm text-muted-foreground">{STATUS_LABEL[account.status] ?? account.status}</span>
            </div>
            <AccountActions organizationId={account.organizationId} />
          </div>
        ))}
        {accounts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta ainda.</p>}
      </div>
    </main>
  )
}
