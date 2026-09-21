"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { CpfInput, PhoneInput } from "@/components/ui/masked-input"
import { isValidCPF } from "@/lib/validators"
import { lookupCep } from "@/lib/viacep"
import type { IntakeFormActionState } from "@/lib/intake/actions"

type IntakeFormValues = {
  name: string
  cpf: string
  whatsapp: string
  email: string
  cep: string
  addressStreet: string
  addressNumber: string
  addressComplement: string
  addressDistrict: string
  addressCity: string
  addressState: string
  consent: boolean
}

const EMPTY_VALUES: IntakeFormValues = {
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
  consent: false,
}

type IntakeFormProps = {
  action: (state: IntakeFormActionState, formData: FormData) => Promise<IntakeFormActionState>
}

function IntakeForm({ action }: IntakeFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null } as IntakeFormActionState)

  const [values, setValues] = React.useState<IntakeFormValues>(EMPTY_VALUES)
  const [cepLoading, setCepLoading] = React.useState(false)

  function setField<K extends keyof IntakeFormValues>(key: K, value: IntakeFormValues[K]) {
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

  if (state.success) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-lg font-semibold">Recebemos seu cadastro!</p>
        <p className="mt-1 text-sm text-muted-foreground">Em breve alguém vai entrar em contato pelo WhatsApp.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Campo-armadilha contra bots: escondido de gente de verdade. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome completo</Label>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input id="email" name="email" type="email" value={values.email} onChange={(e) => setField("email", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cep">CEP (opcional)</Label>
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
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          checked={values.consent}
          onChange={(e) => setField("consent", e.target.checked)}
          className="mt-0.5"
          required
        />
        Autorizo o uso dos meus dados para análise e contato sobre este cadastro.
      </label>

      <FormError message={state.error} />

      <Button type="submit" loading={pending} className="w-full">
        Enviar cadastro
      </Button>
    </form>
  )
}

export { IntakeForm }
