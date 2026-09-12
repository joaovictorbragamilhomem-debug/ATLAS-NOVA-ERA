"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { subscribeAction, type CheckoutState } from "@/lib/asaas/checkout-actions"
import { onlyDigits } from "@/lib/masks"

const initialState: CheckoutState = { error: null }

const PLAN_LABEL: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
  lifetime: "Vitalício",
}

function formatDocument(digits: string): string {
  const d = onlyDigits(digits).slice(0, 14)
  if (d.length <= 11) {
    const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean)
    let result = parts.join(".")
    if (d.length > 9) result += "-" + d.slice(9, 11)
    return result
  }
  let result = d.slice(0, 2)
  if (d.length > 2) result += "." + d.slice(2, 5)
  if (d.length > 5) result += "." + d.slice(5, 8)
  if (d.length > 8) result += "/" + d.slice(8, 12)
  if (d.length > 12) result += "-" + d.slice(12, 14)
  return result
}

function CheckoutForm({ hasPricing }: { hasPricing: boolean }) {
  const [state, action, pending] = useActionState(subscribeAction, initialState)
  const [document, setDocument] = React.useState("")

  if (!hasPricing) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        Os planos ainda estão sendo configurados. Volte em breve.
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plan">Plano</Label>
        <Select name="plan" defaultValue="monthly">
          <SelectTrigger id="plan" className="w-full">
            <SelectValue>{(value: string) => PLAN_LABEL[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
            <SelectItem value="lifetime">Vitalício</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="billingDocument">CPF ou CNPJ (para emitir a cobrança)</Label>
        <Input
          id="billingDocument"
          name="billingDocument"
          value={formatDocument(document)}
          onChange={(e) => setDocument(e.target.value)}
          inputMode="numeric"
          required
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" loading={pending}>
        Ir para o pagamento
      </Button>
      <p className="text-xs text-muted-foreground">
        Você escolhe Pix, boleto ou cartão na próxima tela, direto com a Asaas.
      </p>
    </form>
  )
}

export { CheckoutForm }
