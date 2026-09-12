import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { ImportCustomersForm } from "./_components/import-customers-form"

export default async function ImportarClientesPage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Importar clientes por CSV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Colunas obrigatórias: <code className="rounded bg-muted px-1">nome</code>,{" "}
          <code className="rounded bg-muted px-1">cpf</code>,{" "}
          <code className="rounded bg-muted px-1">whatsapp</code>. Opcionais: email, cep, endereco, numero,
          complemento, bairro, cidade, estado, observacoes, tags.
        </p>
      </div>
      <ImportCustomersForm />
    </main>
  )
}
