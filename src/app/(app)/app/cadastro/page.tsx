"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { signUpAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUpAction, initialState)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Teste grátis por 7 dias</h1>
        <p className="text-sm text-muted-foreground">Sem cartão de crédito, cancele quando quiser.</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationName">Nome da empresa</Label>
          <Input id="organizationName" name="organizationName" autoComplete="organization" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Seu nome</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
          <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" loading={pending} className="w-full">
          Criar minha conta
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/app/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  )
}
