"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCentsToBRL } from "@/lib/masks"
import { calculateAnnualSavingsPercent } from "@/lib/pricing"

type PricingToggleProps = {
  monthlyCents: number | null
  annualCents: number | null
}

const INCLUDED_FEATURES = [
  "Contratos e parcelas gerados automaticamente",
  "Cobrança automática pelo WhatsApp",
  "Pix direto na cobrança",
  "Clientes, contratos e histórico num só lugar",
  "Equipe com permissões (dono, gestor, operador)",
  "Relatórios em PDF e CSV",
]

function PricingToggle({ monthlyCents, annualCents }: PricingToggleProps) {
  const [annual, setAnnual] = React.useState(false)
  const savings = calculateAnnualSavingsPercent(monthlyCents, annualCents)

  const priceCents = annual ? annualCents : monthlyCents
  const priceLabel = priceCents !== null ? formatCentsToBRL(priceCents) : "a definir"
  const period = annual ? "/ano" : "/mês"
  const perDayCents = priceCents !== null ? Math.round(priceCents / (annual ? 365 : 30)) : null

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="pricing-period" className={!annual ? "font-semibold" : "text-muted-foreground"}>
          Mensal
        </Label>
        <Switch id="pricing-period" checked={annual} onCheckedChange={setAnnual} />
        <Label htmlFor="pricing-period" className={annual ? "font-semibold" : "text-muted-foreground"}>
          Anual
        </Label>
        {savings !== null && annual && (
          <span className="rounded-4xl bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            economize {savings}%
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold tabular-nums">{priceLabel}</span>
          {priceCents !== null && <span className="text-muted-foreground">{period}</span>}
        </div>
        {perDayCents !== null && (
          <p className="text-xs text-muted-foreground">menos de {formatCentsToBRL(perDayCents)} por dia</p>
        )}
        <p className="text-sm text-muted-foreground">7 dias grátis, sem cartão de crédito</p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {INCLUDED_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="w-full transition-transform duration-150 ease-out hover:-translate-y-0.5">
        <Button size="lg" nativeButton={false} render={<Link href="/app" prefetch={false} />} className="w-full">
          Testar grátis por 7 dias
        </Button>
      </div>
    </div>
  )
}

export { PricingToggle }
