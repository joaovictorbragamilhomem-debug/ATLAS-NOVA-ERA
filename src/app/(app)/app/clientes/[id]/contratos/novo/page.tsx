import { notFound, redirect } from "next/navigation"
import { requireMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createContractAction, type ContractActionState } from "@/lib/contracts/actions"
import { ContractForm } from "../_components/contract-form"

export default async function NovoContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await requireMembership()
  if (membership.role === "operator") redirect(`/app/clientes/${id}`)

  const supabase = await getSupabaseServerClient()
  const { data: customer } = await supabase.from("customers").select("id, name").eq("id", id).maybeSingle()
  if (!customer) notFound()

  const boundAction = createContractAction.bind(null, id) as (
    state: ContractActionState,
    formData: FormData
  ) => Promise<ContractActionState>

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Novo contrato</h1>
        <p className="text-sm text-muted-foreground">Cliente: {customer.name}</p>
      </div>
      <ContractForm action={boundAction} />
    </main>
  )
}
