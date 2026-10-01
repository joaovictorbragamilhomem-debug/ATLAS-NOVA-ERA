import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import { PricingToggle } from "./pricing-toggle"
import { PRICING } from "@/lib/pricing"
import { formatCentsToBRL } from "@/lib/masks"
import { getLifetimeSeatsRemaining } from "@/lib/lifetime-seats"
import { SectionHeading } from "@/components/marketing/section-heading"

async function PricingSection() {
  const seatsRemaining = await getLifetimeSeatsRemaining()
  const lifetimeLabel = PRICING.lifetimeCents !== null ? formatCentsToBRL(PRICING.lifetimeCents) : "a definir"

  return (
    <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 lg:py-28 sm:px-6 lg:px-8">
      <SectionHeading title="Preços" layout="center">
        O mesmo sistema completo em qualquer plano — você só escolhe como paga. 7 dias grátis, sem cartão de crédito.
      </SectionHeading>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        <Reveal className="h-full">
          <PricingToggle monthlyCents={PRICING.monthlyCents} annualCents={PRICING.annualCents} />
        </Reveal>

        <Reveal
          delay={0.1}
          className="dark relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl border border-primary/50 bg-(--ink) p-6 text-foreground shadow-[0_24px_60px_-24px_color-mix(in_oklch,var(--primary),transparent_55%)] sm:p-8"
        >
          {/* Always-dark panel: the "dark" class swaps every token inside it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 -z-10 size-64 rounded-full bg-primary/20 blur-[90px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Vitalício</span>
            <span className="rounded-4xl bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              pagamento único
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-display text-4xl font-semibold tabular-nums sm:text-5xl">{lifetimeLabel}</span>
            <p className="text-sm text-muted-foreground">uma vez só, acesso para sempre</p>
          </div>

          {seatsRemaining !== null && (
            <p className="text-center text-sm font-medium text-warning">
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

          <div className="mt-auto w-full transition-transform duration-150 ease-out hover:-translate-y-0.5">
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
