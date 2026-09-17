import { requireMembership } from "@/lib/auth/current-user"
import { createCustomerAction } from "@/lib/customers/actions"
import { CustomerForm } from "../_components/customer-form"

export default async function NovoClientePage() {
  await requireMembership()

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <CustomerForm action={createCustomerAction} submitLabel="Cadastrar cliente" />
    </main>
  )
}
