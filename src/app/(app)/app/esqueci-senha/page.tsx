"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { requestPasswordResetAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

export default function EsqueciSenhaPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState)
  const sent = !pending && state.error === null && state !== initialState

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">Enviamos um link para você criar uma senha nova.</p>
      </div>

      {sent ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-center text-sm text-accent-foreground">
          Se esse e-mail tiver uma conta, o link chega em instantes.
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <FormError message={state.error} />
          <Button type="submit" loading={pending} className="w-full">
            Enviar link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/app/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </main>
  )
}
