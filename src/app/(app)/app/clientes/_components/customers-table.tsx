"use client"

import { useRouter } from "next/navigation"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui/responsive-table"
import { formatCPF, formatPhoneBR, e164BRToDigits } from "@/lib/masks"

export type CustomerRow = {
  id: string
  name: string
  cpf: string
  whatsapp: string
  city: string | null
}

const columns: ResponsiveTableColumn<CustomerRow>[] = [
  { key: "name", header: "Nome", render: (c) => c.name },
  { key: "cpf", header: "CPF", render: (c) => formatCPF(c.cpf), hideOnMobile: true },
  { key: "whatsapp", header: "WhatsApp", render: (c) => formatPhoneBR(e164BRToDigits(c.whatsapp)) },
  { key: "city", header: "Cidade", render: (c) => c.city ?? "—", hideOnMobile: true },
]

function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const router = useRouter()

  return (
    <ResponsiveTable
      columns={columns}
      rows={rows}
      getRowKey={(c) => c.id}
      onRowClick={(c) => router.push(`/app/clientes/${c.id}`)}
    />
  )
}

export { CustomersTable }
