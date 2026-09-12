"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CpfInput, PhoneInput } from "@/components/ui/masked-input"
import { isValidCPF } from "@/lib/validators"
import { e164BRToDigits } from "@/lib/masks"
import { lookupCep } from "@/lib/viacep"
import type { CustomerActionState } from "@/lib/customers/actions"

export type CustomerFormValues = {
  name: string
  cpf: string
  whatsapp: string // E.164
  email: string
  cep: string
  addressStreet: string
  addressNumber: string
  addressComplement: string
  addressDistrict: string
  addressCity: string
  addressState: string
  notes: string
  tags: string
}

const EMPTY_VALUES: CustomerFormValues = {
  name: "",
  cpf: "",
  whatsapp: "",
  email: "",
  cep: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  notes: "",
  tags: "",
}

type CustomerFormProps = {
  action: (state: CustomerActionState, formData: FormData) => Promise<CustomerActionState>
  initialValues?: Partial<CustomerFormValues>
  submitLabel: string
}

// Todos os campos são controlados (useState) de propósito: o React 19
// reseta sozinho os campos "não controlados" (defaultValue) sempre que uma
// Server Action termina — mesmo quando ela só retorna um erro de validação.
// Sem isso, um erro de CPF apagaria o nome, e-mail etc. que a pessoa já
// tinha digitado.
function CustomerForm({ action, initialValues, submitLabel }: CustomerFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null } as CustomerActionState)

  const [values, setValues] = React.useState<CustomerFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
    whatsapp: initialValues?.whatsapp ? e164BRToDigits(initialValues.whatsapp) : "",
  })
  const [cepLoading, setCepLoading] = React.useState(false)

  function setField<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const cpfTouched = values.cpf.length === 11
  const cpfValid = !cpfTouched || isValidCPF(values.cpf)

  async function handleCepBlur() {
    if (values.cep.replace(/\D/g, "").length !== 8) return
    setCepLoading(true)
    const address = await lookupCep(values.cep)
    setCepLoading(false)
    if (address) {
      setValues((v) => ({
        ...v,
        addressStreet: address.street,
        addressDistrict: address.district,
        addressCity: address.city,
        addressState: address.state,
      }))
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" value={values.name} onChange={(e) => setField("name", e.target.value)} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <CpfInput
            id="cpf"
            name="cpf"
            value={values.cpf}
            onValueChange={(v) => setField("cpf", v)}
            aria-invalid={!cpfValid}
            required
          />
          {!cpfValid && <p className="text-xs text-destructive">CPF inválido.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <PhoneInput id="whatsapp" name="whatsapp" value={values.whatsapp} onValueChange={(v) => setField("whatsapp", v)} required />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="email">E-mail (opcional)</Label>
          <Input id="email" name="email" type="email" value={values.email} onChange={(e) => setField("email", e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            name="cep"
            value={values.cep}
            onChange={(e) => setField("cep", e.target.value)}
            onBlur={handleCepBlur}
            placeholder="00000-000"
          />
          {cepLoading && <p className="text-xs text-muted-foreground">Buscando endereço…</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            name="addressNumber"
            value={values.addressNumber}
            onChange={(e) => setField("addressNumber", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="addressStreet">Rua</Label>
          <Input
            id="addressStreet"
            name="addressStreet"
            value={values.addressStreet}
            onChange={(e) => setField("addressStreet", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressComplement">Complemento</Label>
          <Input
            id="addressComplement"
            name="addressComplement"
            value={values.addressComplement}
            onChange={(e) => setField("addressComplement", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressDistrict">Bairro</Label>
          <Input
            id="addressDistrict"
            name="addressDistrict"
            value={values.addressDistrict}
            onChange={(e) => setField("addressDistrict", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressCity">Cidade</Label>
          <Input
            id="addressCity"
            name="addressCity"
            value={values.addressCity}
            onChange={(e) => setField("addressCity", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressState">Estado</Label>
          <Input
            id="addressState"
            name="addressState"
            value={values.addressState}
            onChange={(e) => setField("addressState", e.target.value.toUpperCase().slice(0, 2))}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="tags">Tags (separe por vírgula)</Label>
          <Input id="tags" name="tags" value={values.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="vip, indicação" />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" value={values.notes} onChange={(e) => setField("notes", e.target.value)} />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  )
}

export { CustomerForm }
