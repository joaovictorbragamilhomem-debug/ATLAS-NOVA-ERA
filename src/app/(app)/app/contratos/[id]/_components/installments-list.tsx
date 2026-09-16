"use client"

import * as React from "react"
import { toast } from "sonner"
import { Undo2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/masked-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCentsToBRL, formatISODateToBR } from "@/lib/masks"
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount"
import { getInstallmentVisualStatus, type InstallmentDbStatus } from "@/lib/installments/visual-status"
import { registerInstallmentPaymentAction, reverseInstallmentPaymentAction } from "@/lib/installments/actions"

export type InstallmentRowData = {
  id: string
  number: number
  due_date: string
  amount_cents: number
  paid_amount_cents: number
  status: InstallmentDbStatus
}

export type PaymentRowData = {
  id: string
  installment_id: string
  amount_cents: number
  method: "pix" | "dinheiro" | "transferencia" | "cartao"
  paid_at: string
  reversed_at: string | null
  reversed_reason: string | null
}

const METHOD_LABEL: Record<PaymentRowData["method"], string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
}

const PAYABLE_STATUSES: InstallmentDbStatus[] = ["pending", "partially_paid", "reversed"]

function PaymentHistoryItem({ payment, canReverse }: { payment: PaymentRowData; canReverse: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  async function handleReverse() {
    setBusy(true)
    const result = await reverseInstallmentPaymentAction(payment.id, reason)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pagamento estornado.")
    setOpen(false)
    setReason("")
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className={payment.reversed_at ? "line-through" : undefined}>
        {formatCentsToBRL(payment.amount_cents)} · {METHOD_LABEL[payment.method]} ·{" "}
        {new Date(payment.paid_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        {payment.reversed_at && " · estornado"}
      </span>
      {!payment.reversed_at && canReverse && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <Undo2Icon />
            <span className="sr-only">Estornar pagamento</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Estornar pagamento</DialogTitle>
              <DialogDescription>
                {formatCentsToBRL(payment.amount_cents)} recebido em{" "}
                {new Date(payment.paid_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Essa
                ação some da parcela e fica registrada na auditoria.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reason-${payment.id}`}>Motivo do estorno</Label>
              <Textarea
                id={`reason-${payment.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: valor lançado por engano"
                required
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button variant="destructive" loading={busy} disabled={!reason.trim()} onClick={handleReverse}>
                Confirmar estorno
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function InstallmentRow({
  installment,
  payments,
  lateFeePercent,
  lateInterestMonthlyPercent,
  todayISODate,
  canReverse,
}: {
  installment: InstallmentRowData
  payments: PaymentRowData[]
  lateFeePercent: number
  lateInterestMonthlyPercent: number
  todayISODate: string
  canReverse: boolean
}) {
  const updatedAmountCents = calculateUpdatedAmountCents({
    amountCents: installment.amount_cents,
    dueDate: installment.due_date,
    referenceDate: todayISODate,
    lateFeePercent,
    lateInterestMonthlyPercent,
  })
  const suggestedAmountCents = calculateRemainingBalanceCents(updatedAmountCents, installment.paid_amount_cents)

  const [open, setOpen] = React.useState(false)
  const [amountCents, setAmountCents] = React.useState(suggestedAmountCents)
  const [method, setMethod] = React.useState<PaymentRowData["method"]>("pix")
  const [busy, setBusy] = React.useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setAmountCents(suggestedAmountCents)
  }

  async function handleConfirm() {
    setBusy(true)
    const result = await registerInstallmentPaymentAction(installment.id, amountCents, method)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Baixa registrada.")
    setOpen(false)
  }

  const isPayable = PAYABLE_STATUSES.includes(installment.status)
  const isLate = updatedAmountCents > installment.amount_cents

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums">#{installment.number}</span>
          <span className="text-sm text-muted-foreground">{formatISODateToBR(installment.due_date)}</span>
          <StatusBadge status={getInstallmentVisualStatus(installment, todayISODate)} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatCentsToBRL(installment.amount_cents)}</p>
            {isPayable && isLate && (
              <p className="text-xs text-warning tabular-nums">
                atualizado: {formatCentsToBRL(updatedAmountCents)}
              </p>
            )}
          </div>
          {isPayable && (
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger render={<Button size="sm" />}>Dar baixa</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dar baixa — parcela {installment.number}</DialogTitle>
                  <DialogDescription>Confirme o valor recebido e a forma de pagamento.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`amount-${installment.id}`}>Valor recebido</Label>
                    <CurrencyInput id={`amount-${installment.id}`} value={amountCents} onValueChange={setAmountCents} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`method-${installment.id}`}>Forma de pagamento</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as PaymentRowData["method"])}>
                      <SelectTrigger id={`method-${installment.id}`} className="w-full">
                        <SelectValue>{(value: PaymentRowData["method"]) => METHOD_LABEL[value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                  <Button loading={busy} disabled={amountCents <= 0} onClick={handleConfirm}>
                    Confirmar baixa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {payments.map((payment) => (
            <PaymentHistoryItem key={payment.id} payment={payment} canReverse={canReverse} />
          ))}
        </div>
      )}
    </li>
  )
}

type InstallmentsListProps = {
  contract: { id: string; lateFeePercent: number; lateInterestMonthlyPercent: number }
  installments: InstallmentRowData[]
  payments: PaymentRowData[]
  todayISODate: string
  canReverse: boolean
}

function InstallmentsList({ contract, installments, payments, todayISODate, canReverse }: InstallmentsListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {installments.map((installment) => (
        <InstallmentRow
          key={installment.id}
          installment={installment}
          payments={payments.filter((p) => p.installment_id === installment.id)}
          lateFeePercent={contract.lateFeePercent}
          lateInterestMonthlyPercent={contract.lateInterestMonthlyPercent}
          todayISODate={todayISODate}
          canReverse={canReverse}
        />
      ))}
    </ul>
  )
}

export { InstallmentsList }
