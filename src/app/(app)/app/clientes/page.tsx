import Link from "next/link"
import { redirect } from "next/navigation"
import { PlusIcon, UsersIcon, UploadIcon } from "lucide-react"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CustomersTable, type CustomerRow } from "./_components/customers-table"

export default async function ClientesPage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from("customers")
    .select("id, name, cpf, whatsapp, address_city")
    .eq("organization_id", membership.organizationId)
    .order("name")

  const customers: CustomerRow[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    cpf: c.cpf,
    whatsapp: c.whatsapp,
    city: c.address_city,
  }))

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" nativeButton={false} render={<Link href="/app/clientes/importar" />}>
            <UploadIcon /> Importar CSV
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/app/clientes/novo" />}>
            <PlusIcon /> Novo cliente
          </Button>
        </div>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum cliente ainda"
          description="Cadastre o primeiro cliente para começar a criar contratos."
          action={
            <Button size="sm" nativeButton={false} render={<Link href="/app/clientes/novo" />}>
              <PlusIcon /> Novo cliente
            </Button>
          }
        />
      ) : (
        <CustomersTable rows={customers} />
      )}
    </main>
  )
}
