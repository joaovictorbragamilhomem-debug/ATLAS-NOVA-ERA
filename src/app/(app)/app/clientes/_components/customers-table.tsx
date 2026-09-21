"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui/responsive-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCPF, formatPhoneBR, e164BRToDigits, onlyDigits } from "@/lib/masks"

export type CustomerRow = {
  id: string
  name: string
  cpf: string
  whatsapp: string
  city: string | null
  overdue: boolean
}

type StatusFilter = "all" | "overdue" | "current"

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: "Todos",
  overdue: "Atrasado",
  current: "Em dia",
}

const columns: ResponsiveTableColumn<CustomerRow>[] = [
  {
    key: "name",
    header: "Nome",
    render: (c) => (
      <div className="flex items-center gap-2">
        {c.name}
        {c.overdue && (
          <Badge variant="destructive" className="text-xs">
            Atrasado
          </Badge>
        )}
      </div>
    ),
  },
  { key: "cpf", header: "CPF", render: (c) => formatCPF(c.cpf), hideOnMobile: true },
  { key: "whatsapp", header: "WhatsApp", render: (c) => formatPhoneBR(e164BRToDigits(c.whatsapp)) },
  { key: "city", header: "Cidade", render: (c) => c.city ?? "—", hideOnMobile: true },
]

function CustomersTable({ rows, initialSearch = "" }: { rows: CustomerRow[]; initialSearch?: string }) {
  const router = useRouter()
  const [search, setSearch] = React.useState(initialSearch)
  const [status, setStatus] = React.useState<StatusFilter>("all")

  const filtered = React.useMemo(() => {
    const searchDigits = onlyDigits(search)
    const searchLower = search.trim().toLowerCase()

    return rows.filter((c) => {
      if (status === "overdue" && !c.overdue) return false
      if (status === "current" && c.overdue) return false

      if (!searchLower) return true
      const matchesText =
        c.name.toLowerCase().includes(searchLower) || (c.city ?? "").toLowerCase().includes(searchLower)
      const matchesDigits = searchDigits.length > 0 && (c.cpf.includes(searchDigits) || c.whatsapp.includes(searchDigits))
      return matchesText || matchesDigits
    })
  }, [rows, search, status])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, WhatsApp ou cidade"
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as StatusFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue>{(value: string) => STATUS_FILTER_LABEL[value as StatusFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
            <SelectItem value="current">Em dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={filtered}
          getRowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/app/clientes/${c.id}`)}
        />
      )}
    </div>
  )
}

export { CustomersTable }
