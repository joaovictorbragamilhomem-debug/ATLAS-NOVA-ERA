import Link from "next/link"
import { PlusIcon, UsersIcon, UploadIcon } from "lucide-react"
import { requireMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { todayInSaoPauloISODate } from "@/lib/finance/dates"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CustomersTable, type CustomerRow } from "./_components/customers-table"

const OPEN_INSTALLMENT_STATUSES = ["pending", "partially_paid", "reversed"]

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const membership = await requireMembership()
  const { busca } = await searchParams

  const supabase = await getSupabaseServerClient()
  const today = todayInSaoPauloISODate()

  const [{ data: customersData }, { data: overdueData }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, cpf, whatsapp, address_city")
      .eq("organization_id", membership.organizationId)
      .order("name"),
    supabase
      .from("installments")
      .select("contracts(customer_id)")
      .eq("organization_id", membership.organizationId)
      .in("status", OPEN_INSTALLMENT_STATUSES)
      .lt("due_date", today),
  ])

  const overdueCustomerIds = new Set(
    (overdueData ?? []).flatMap((row) => {
      const contract = Array.isArray(row.contracts) ? row.contracts[0] : row.contracts
      return contract ? [contract.customer_id] : []
    })
  )

  const customers: CustomerRow[] = (customersData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    cpf: c.cpf,
    whatsapp: c.whatsapp,
    city: c.address_city,
    overdue: overdueCustomerIds.has(c.id),
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
        <CustomersTable rows={customers} initialSearch={busca ?? ""} />
      )}
    </main>
  )
}
