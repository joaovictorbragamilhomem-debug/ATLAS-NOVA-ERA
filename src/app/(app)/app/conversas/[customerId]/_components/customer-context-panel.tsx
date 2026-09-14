import Link from "next/link"
import { formatCentsToBRL } from "@/lib/masks"
import type { CustomerContractSummary } from "@/lib/customers/get-customer-with-contracts"

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

function CustomerContextPanel({
  customerId,
  customerName,
  contracts,
}: {
  customerId: string
  customerName: string
  contracts: CustomerContractSummary[]
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-xs text-muted-foreground">Cliente</p>
        <Link href={`/app/clientes/${customerId}`} className="font-medium underline-offset-2 hover:underline">
          {customerName}
        </Link>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Contratos</p>
        {contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contrato ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <Link
                  href={`/app/contratos/${contract.id}`}
                  className="flex flex-col rounded-lg border border-border p-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{formatCentsToBRL(contract.principalAmountCents)}</span>
                  <span className="text-xs text-muted-foreground">
                    {contract.installmentsCount}x · {PERIODICITY_LABEL[contract.periodicity]} ·{" "}
                    {CONTRACT_STATUS_LABEL[contract.status] ?? contract.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export { CustomerContextPanel }
