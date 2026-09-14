import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PencilIcon, PlusIcon, FileTextIcon } from "lucide-react"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getCustomerWithContracts } from "@/lib/customers/get-customer-with-contracts"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCPF, formatPhoneBR, e164BRToDigits, formatCentsToBRL } from "@/lib/masks"

const PERIODICITY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
}

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  completed: "Concluído",
  renegotiated: "Renegociado",
  canceled: "Cancelado",
}

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const { customer, contracts } = await getCustomerWithContracts(id)

  if (!customer) notFound()

  const canCreateContract = membership.role !== "operator"

  const address = [customer.address_street, customer.address_number, customer.address_district, customer.address_city, customer.address_state]
    .filter(Boolean)
    .join(", ")

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{formatCPF(customer.cpf)}</p>
        </div>
        <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={`/app/clientes/${id}/editar`} />}>
          <PencilIcon /> Editar
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">WhatsApp</span>
          <span>{formatPhoneBR(e164BRToDigits(customer.whatsapp))}</span>
        </div>
        {customer.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span>{customer.email}</span>
          </div>
        )}
        {address && (
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Endereço</span>
            <span className="text-right">{address}</span>
          </div>
        )}
        {customer.tags?.length > 0 && (
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Tags</span>
            <span className="text-right">{customer.tags.join(", ")}</span>
          </div>
        )}
        {customer.notes && (
          <div className="flex flex-col gap-1 border-t border-border pt-2">
            <span className="text-muted-foreground">Observações</span>
            <span>{customer.notes}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contratos</h2>
          {canCreateContract && (
            <Button size="sm" nativeButton={false} render={<Link href={`/app/clientes/${id}/contratos/novo`} />}>
              <PlusIcon /> Novo contrato
            </Button>
          )}
        </div>

        {contracts.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="Nenhum contrato ainda"
            description={
              canCreateContract
                ? "Crie o primeiro contrato para gerar o carnê de parcelas deste cliente."
                : "Peça para o Dono ou Gestor criar o primeiro contrato."
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <Link
                  href={`/app/contratos/${contract.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCentsToBRL(contract.principalAmountCents)}</span>
                    <span className="text-xs text-muted-foreground">
                      {contract.installmentsCount}x · {PERIODICITY_LABEL[contract.periodicity]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {CONTRACT_STATUS_LABEL[contract.status] ?? contract.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
