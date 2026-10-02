"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { createOrganizationForCurrentUserAction, signOutAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

// Controlled fields for the same reason as the sign-up form: React 19 resets
// uncontrolled fields whenever a Server Action returns, even on an error.
function CreateOrganizationForm({ defaultFullName }: { defaultFullName: string }) {
  const [state, action, pending] = useActionState(createOrganizationForCurrentUserAction, initialState)
  const [organizationName, setOrganizationName] = React.useState("")
  const [fullName, setFullName] = React.useState(defaultFullName)

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationName">Nome da empresa</Label>
          <Input
            id="organizationName"
            name="organizationName"
            autoComplete="organization"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Seu nome</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <FormError message={state.error} />
        <Button type="submit" loading={pending} className="w-full">
          Começar meu teste grátis
        </Button>
      </form>
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Não é você? Sair desta conta
        </button>
      </form>
    </div>
  )
}

export { CreateOrganizationForm }
