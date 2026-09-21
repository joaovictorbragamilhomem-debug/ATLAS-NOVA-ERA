"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/masked-input"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { localDateToISODate, isoDateToLocalDate, type Periodicity } from "@/lib/finance/dates"
import type { ContractActionState } from "@/lib/contracts/actions"

const PERIODICITY_LABEL: Record<Periodicity, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
}

type ContractFormValues = {
  principalAmountCents: number
  installmentsCount: string
  periodicity: Periodicity
  firstDueDate: string // ISO (yyyy-mm-dd)
  installmentAmountCents: number
  lateFeePercent: string
  lateInterestMonthlyPercent: string
  notes: string
}

const EMPTY_VALUES: ContractFormValues = {
  principalAmountCents: 0,
  installmentsCount: "",
  periodicity: "monthly",
  firstDueDate: "",
  installmentAmountCents: 0,
  lateFeePercent: "2",
  lateInterestMonthlyPercent: "1",
  notes: "",
}

type ContractFormProps = {
  action: (state: ContractActionState, formData: FormData) => Promise<ContractActionState>
  initialPrincipalAmountCents?: number
  submitLabel?: string
}

// Campos controlados (useState) pelo mesmo motivo do CustomerForm: o React 19
// reseta campos não controlados sempre que uma Server Action termina, mesmo
// quando ela só devolve um erro de validação.
function ContractForm({ action, initialPrincipalAmountCents, submitLabel }: ContractFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null } as ContractActionState)
  const [values, setValues] = React.useState<ContractFormValues>({
    ...EMPTY_VALUES,
    principalAmountCents: initialPrincipalAmountCents ?? 0,
  })
  const [installmentAmountTouched, setInstallmentAmountTouched] = React.useState(false)

  function setField<K extends keyof ContractFormValues>(key: K, value: ContractFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  // Sugestão automática: valor da parcela = total ÷ número de parcelas, só
  // enquanto a pessoa não tiver editado esse campo manualmente. Recalculada
  // diretamente nos onChange de principal/parcelas, sem useEffect.
  function setFieldAndSuggestInstallmentAmount<K extends "principalAmountCents" | "installmentsCount">(
    key: K,
    value: ContractFormValues[K]
  ) {
    setValues((v) => {
      const next = { ...v, [key]: value }
      if (installmentAmountTouched) return next
      const count = parseInt(next.installmentsCount, 10)
      if (next.principalAmountCents > 0 && Number.isInteger(count) && count > 0) {
        next.installmentAmountCents = Math.ceil(next.principalAmountCents / count)
      }
      return next
    })
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="principalAmountCents">Valor total do contrato</Label>
          <CurrencyInput
            id="principalAmountCents"
            name="principalAmountCents"
            value={values.principalAmountCents}
            onValueChange={(v) => setFieldAndSuggestInstallmentAmount("principalAmountCents", v)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installmentsCount">Número de parcelas</Label>
          <Input
            id="installmentsCount"
            name="installmentsCount"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.installmentsCount}
            onChange={(e) => setFieldAndSuggestInstallmentAmount("installmentsCount", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periodicity">Periodicidade</Label>
          <Select
            name="periodicity"
            value={values.periodicity}
            onValueChange={(v) => setField("periodicity", v as Periodicity)}
          >
            <SelectTrigger id="periodicity" className="w-full">
              <SelectValue>{(value: Periodicity) => PERIODICITY_LABEL[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quinzenal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstDueDate">Primeiro vencimento</Label>
          <DatePicker
            value={values.firstDueDate ? isoDateToLocalDate(values.firstDueDate) : undefined}
            onValueChange={(date) => setField("firstDueDate", date ? localDateToISODate(date) : "")}
          />
          <input type="hidden" name="firstDueDate" value={values.firstDueDate} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installmentAmountCents">Valor de cada parcela</Label>
          <CurrencyInput
            id="installmentAmountCents"
            name="installmentAmountCents"
            value={values.installmentAmountCents}
            onValueChange={(v) => {
              setInstallmentAmountTouched(true)
              setField("installmentAmountCents", v)
            }}
            required
          />
        </div>

        <div />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lateFeePercent">Multa por atraso (%)</Label>
          <Input
            id="lateFeePercent"
            name="lateFeePercent"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={values.lateFeePercent}
            onChange={(e) => setField("lateFeePercent", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lateInterestMonthlyPercent">Juros de mora ao mês (%)</Label>
          <Input
            id="lateInterestMonthlyPercent"
            name="lateInterestMonthlyPercent"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={values.lateInterestMonthlyPercent}
            onChange={(e) => setField("lateInterestMonthlyPercent", e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground sm:col-span-2">
          Fique de olho nos limites legais de multa e juros para o seu tipo de operação — o ATLAS não
          define isso por você. Na dúvida, confirme com um contador ou advogado antes de definir esses
          percentuais.
        </p>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" value={values.notes} onChange={(e) => setField("notes", e.target.value)} />
        </div>
      </div>

      <FormError message={state.error} />

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        {submitLabel ?? "Criar contrato e gerar carnê"}
      </Button>
    </form>
  )
}

export { ContractForm }
