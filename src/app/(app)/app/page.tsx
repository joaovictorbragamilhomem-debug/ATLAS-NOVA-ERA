import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSubscriptionStatus } from "@/lib/auth/subscription-status"
import { signOutAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"

const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  manager: "Gestor",
  operator: "Operador",
}

export default async function AppHomePage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const subscription = await getSubscriptionStatus(membership.organizationId)

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

      <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
        O painel (clientes, contratos, parcelas) chega na Fase 4.
      </div>
    </main>
  )
}
