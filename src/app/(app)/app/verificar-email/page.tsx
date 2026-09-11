import { MailCheckIcon } from "lucide-react"

export default function VerificarEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MailCheckIcon className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold">Confirme seu e-mail</h1>
      <p className="text-sm text-muted-foreground">
        Sua conta foi criada e o teste grátis de 7 dias já começou. Mandamos um link de confirmação
        para o seu e-mail — clique nele para entrar no painel.
      </p>
    </main>
  )
}
