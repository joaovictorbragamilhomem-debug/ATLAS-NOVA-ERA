"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCPF, formatPhoneBR, e164BRToDigits } from "@/lib/masks"
import { approveIntakeFormAction, rejectIntakeFormAction } from "@/lib/intake/actions"

export type IntakeFormRow = {
  id: string
  name: string
  cpf: string
  whatsapp: string
  status: "received" | "in_review" | "approved" | "rejected"
  createdAt: string
}

const STATUS_LABEL: Record<IntakeFormRow["status"], string> = {
  received: "Recebida",
  in_review: "Em análise",
  approved: "Aprovada",
  rejected: "Rejeitada",
}

function IntakeFormItem({ row, showActions }: { row: IntakeFormRow; showActions: boolean }) {
  const [busy, setBusy] = React.useState(false)
  const [handled, setHandled] = React.useState(false)

  async function handleApprove() {
    setBusy(true)
    const result = await approveIntakeFormAction(row.id)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Cliente criado a partir da ficha.")
    setHandled(true)
  }

  async function handleReject() {
    setBusy(true)
    const result = await rejectIntakeFormAction(row.id)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Ficha rejeitada.")
    setHandled(true)
  }

  if (handled) return null

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatCPF(row.cpf)} · {formatPhoneBR(e164BRToDigits(row.whatsapp))}
        </span>
      </div>
      {showActions ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" loading={busy} onClick={handleReject}>
            Rejeitar
          </Button>
          <Button size="sm" loading={busy} onClick={handleApprove}>
            Aprovar
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">{STATUS_LABEL[row.status]}</span>
      )}
    </li>
  )
}

function IntakeFormsList({ rows, showActions }: { rows: IntakeFormRow[]; showActions: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <IntakeFormItem key={row.id} row={row} showActions={showActions} />
      ))}
    </ul>
  )
}

export { IntakeFormsList }
