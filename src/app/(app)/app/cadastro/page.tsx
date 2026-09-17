"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { signUpAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

// Campos controlados (useState) pelo mesmo motivo do CustomerForm/ContractForm:
// o React 19 reseta campos não controlados sempre que uma Server Action
// termina, mesmo quando ela só devolve um erro — a pessoa perdia tudo que
// tinha digitado e tinha que preencher de novo.
export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUpAction, initialState)
  const [organizationName, setOrganizationName] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [confirmError, setConfirmError] = React.useState("")

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Teste grátis por 7 dias</h1>
        <p className="text-sm text-muted-foreground">Sem cartão de crédito, cancele quando quiser.</p>
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
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
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
        {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
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
