import { requireMembership } from "@/lib/auth/current-user"
import { getSubscriptionStatus } from "@/lib/auth/subscription-status"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { CheckoutForm } from "./_components/checkout-form"
import { PRICING } from "@/lib/pricing"

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste grátis",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  lifetime: "Vitalícia",
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
  lifetime: "Vitalício",
}

export default async function AssinaturaPage() {
  const membership = await requireMembership()

  const subscription = await getSubscriptionStatus(membership.organizationId)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Assinatura</h1>

      <Card>
        <CardHeader>
          <CardTitle>{subscription ? STATUS_LABEL[subscription.status] : "—"}</CardTitle>
          <CardDescription>
            {subscription ? PLAN_LABEL[subscription.plan] : "Nenhuma assinatura encontrada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {subscription?.status === "trialing" && (
            <p className="text-muted-foreground">
              Seu teste grátis termina em {subscription.trialDaysLeft} dia(s).
            </p>
          )}
          {subscription?.currentPeriodEnd && (
            <p className="text-muted-foreground">
              Próxima cobrança:{" "}
              {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
                new Date(subscription.currentPeriodEnd)
              )}
            </p>
          )}
          {membership.role !== "owner" && (
            <p className="text-muted-foreground">Só o Dono da conta pode assinar ou trocar de plano.</p>
          )}
        </CardContent>
      </Card>

      {membership.role === "owner" && (subscription?.status === "trialing" || subscription?.status === "past_due") && (
        <CheckoutForm hasPricing={PRICING.monthlyCents !== null} />
      )}
    </main>
  )
}
