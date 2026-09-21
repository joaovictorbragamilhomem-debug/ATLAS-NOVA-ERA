import { requireMembership } from "@/lib/auth/current-user"
import { createCustomerAction } from "@/lib/customers/actions"
import { onlyDigits, phoneDigitsToE164BR } from "@/lib/masks"
import { CustomerForm } from "../_components/customer-form"

export default async function NovoClientePage({ searchParams }: { searchParams: Promise<{ whatsapp?: string }> }) {
  await requireMembership()

  // Vem do botão "Cadastrar como cliente" em Conversas; só aceita DDD + número.
  const { whatsapp } = await searchParams
  const digits = onlyDigits(whatsapp ?? "")
  const initialWhatsapp = digits.length === 10 || digits.length === 11 ? phoneDigitsToE164BR(digits) : undefined

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <CustomerForm
        action={createCustomerAction}
        initialValues={initialWhatsapp ? { whatsapp: initialWhatsapp } : undefined}
        submitLabel="Cadastrar cliente"
      />
    </main>
  )
}
