import { notFound, redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { updateCustomerAction, type CustomerActionState } from "@/lib/customers/actions"
import { CustomerForm } from "../../_components/customer-form"

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const supabase = await getSupabaseServerClient()
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle()
  if (!customer) notFound()

  const boundAction = updateCustomerAction.bind(null, id) as (
    state: CustomerActionState,
    formData: FormData
  ) => Promise<CustomerActionState>

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Editar {customer.name}</h1>
      <CustomerForm
        action={boundAction}
        submitLabel="Salvar alterações"
        initialValues={{
          name: customer.name,
          cpf: customer.cpf,
          whatsapp: customer.whatsapp,
          email: customer.email ?? "",
          cep: customer.cep ?? "",
          addressStreet: customer.address_street ?? "",
          addressNumber: customer.address_number ?? "",
          addressComplement: customer.address_complement ?? "",
          addressDistrict: customer.address_district ?? "",
          addressCity: customer.address_city ?? "",
          addressState: customer.address_state ?? "",
          notes: customer.notes ?? "",
          tags: (customer.tags ?? []).join(", "),
        }}
      />
    </main>
  )
}
