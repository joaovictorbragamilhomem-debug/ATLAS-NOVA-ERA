"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { updatePasswordAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

export default function RedefinirSenhaPage() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [confirmError, setConfirmError] = React.useState("")

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Escolha uma senha nova para a sua conta.</p>
      </div>

      <form
        action={action}
        onSubmit={(e) => {
          if (password !== confirmPassword) {
            e.preventDefault()
            setConfirmError("As senhas não coincidem.")
            return
          }
          setConfirmError("")
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <FormError message={confirmError} />
        <FormError message={state.error} />
        <Button type="submit" loading={pending} className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </main>
  )
}
