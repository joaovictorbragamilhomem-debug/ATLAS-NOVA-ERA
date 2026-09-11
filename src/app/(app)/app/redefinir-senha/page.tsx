"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePasswordAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

export default function RedefinirSenhaPage() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Escolha uma senha nova para a sua conta.</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" loading={pending} className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </main>
  )
}
