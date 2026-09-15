import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import { PricingToggle } from "./pricing-toggle"
import { PRICING } from "@/lib/pricing"
import { formatCentsToBRL } from "@/lib/masks"
import { getLifetimeSeatsRemaining } from "@/lib/lifetime-seats"

async function PricingSection() {
  const seatsRemaining = await getLifetimeSeatsRemaining()
  const lifetimeLabel = PRICING.lifetimeCents !== null ? formatCentsToBRL(PRICING.lifetimeCents) : "a definir"

  return (
    <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Preços</h2>
        <p className="mt-2 text-muted-foreground">Todos os planos incluem 7 dias grátis, sem cartão de crédito.</p>
      </Reveal>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        <Reveal>
          <PricingToggle monthlyCents={PRICING.monthlyCents} annualCents={PRICING.annualCents} />
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6 rounded-2xl border-2 border-primary bg-card p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Vitalício</span>
            <span className="rounded-4xl bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              pagamento único
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-4xl font-semibold tabular-nums">{lifetimeLabel}</span>
            <p className="text-sm text-muted-foreground">uma vez só, acesso para sempre</p>
          </div>

          {seatsRemaining !== null && (
            <p className="text-center text-sm font-medium text-[#B45309]">
              {seatsRemaining} vagas restantes
            </p>
          )}

          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" /> Tudo do plano Anual
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" /> Sem mensalidade nunca mais
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" /> Vagas limitadas
            </li>
          </ul>

          <div className="w-full transition-transform duration-150 ease-out hover:-translate-y-0.5">
            <Button size="lg" nativeButton={false} render={<Link href="/app" prefetch={false} />} className="w-full">
              Testar grátis por 7 dias
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export { PricingSection }
