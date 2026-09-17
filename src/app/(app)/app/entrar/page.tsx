"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { signInWithPasswordAction, signInWithMagicLinkAction, type ActionState } from "@/lib/auth/actions"

const initialState: ActionState = { error: null }

export default function EntrarPage() {
  return (
    <React.Suspense>
      <EntrarForm />
    </React.Suspense>
  )
}

function EntrarForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("proximo") ?? "/app"
  const erro = searchParams.get("erro")
  const erroLink = erro === "link_invalido"
  const erroSemOrganizacao = erro === "sem_organizacao"
  const [mode, setMode] = React.useState<"senha" | "magico">("senha")

  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPasswordAction, initialState)
  const [magicState, magicAction, magicPending] = useActionState(signInWithMagicLinkAction, initialState)
  const [magicSent, setMagicSent] = React.useState(false)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse o painel do ATLAS NOVA ERA</p>
      </div>

      {erroLink && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          Esse link expirou ou já foi usado. Tente entrar de novo.
        </p>
      )}

      {erroSemOrganizacao && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          Sua conta não está vinculada a nenhuma empresa no momento. Fale com quem administra sua
          organização no ATLAS.
        </p>
      )}

      {mode === "senha" ? (
        <form
          action={passwordAction}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="next" value={next} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/app/esqueci-senha" className="text-xs text-muted-foreground hover:text-foreground">
                Esqueci a senha
              </Link>
            </div>
            <PasswordInput id="password" name="password" autoComplete="current-password" required />
          </div>
          {passwordState.error && <p className="text-sm text-destructive">{passwordState.error}</p>}
          <Button type="submit" loading={passwordPending} className="w-full">
            Entrar
          </Button>
          <button
            type="button"
            onClick={() => setMode("magico")}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Prefiro entrar com um link por e-mail
          </button>
        </form>
      ) : (
        <form
          action={(formData) => {
            magicAction(formData)
            setMagicSent(true)
          }}
          className="flex flex-col gap-4"
        >
          {magicSent && !magicPending && magicState.error === null ? (
            <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              Te mandamos um link — confira sua caixa de entrada.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="magic-email">E-mail</Label>
                <Input id="magic-email" name="email" type="email" autoComplete="email" required />
              </div>
              {magicState.error && <p className="text-sm text-destructive">{magicState.error}</p>}
              <Button type="submit" loading={magicPending} className="w-full">
                Enviar link
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setMode("senha")
              setMagicSent(false)
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Prefiro entrar com senha
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/app/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">
          Cadastre-se grátis
        </Link>
      </p>
    </main>
  )
}
