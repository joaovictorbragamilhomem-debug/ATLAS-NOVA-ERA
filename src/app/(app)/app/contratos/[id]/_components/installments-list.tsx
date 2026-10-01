"use client"

import * as React from "react"
import { toast } from "sonner"
import { Undo2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { AmountReview } from "@/components/ui/amount-review"
import { calculateUpdatedAmountCents, calculateRemainingBalanceCents } from "@/lib/finance/installment-amount"
import { getInstallmentVisualStatus, type InstallmentDbStatus } from "@/lib/installments/visual-status"
import { reverseInstallmentPaymentAction } from "@/lib/installments/actions"
import { RegisterPaymentDialog, PAYMENT_METHOD_LABEL, type PaymentMethod } from "../../../_components/register-payment-dialog"
import { WhatsAppChargeDialog } from "../../../_components/whatsapp-charge-dialog"
import type { ChargeLinks } from "@/lib/whatsapp/get-charge-links"

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
  method: PaymentMethod
  paid_at: string
  reversed_at: string | null
  reversed_reason: string | null
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
    toast.success(`Pagamento de ${formatCentsToBRL(payment.amount_cents)} desfeito.`)
    setOpen(false)
    setReason("")
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span className={payment.reversed_at ? "line-through" : undefined}>
        {formatCentsToBRL(payment.amount_cents)} · {PAYMENT_METHOD_LABEL[payment.method]} ·{" "}
        {new Date(payment.paid_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        {payment.reversed_at && " · desfeito (estornado)"}
      </span>
      {!payment.reversed_at && canReverse && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="ghost" size="sm" />}>
            <Undo2Icon aria-hidden="true" /> Desfazer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desfazer este pagamento?</DialogTitle>
              <DialogDescription>
                Use quando o pagamento foi lançado por engano (isso também é chamado de &ldquo;estorno&rdquo;). O
                valor volta a ficar em aberto na parcela e o registro fica guardado no histórico.
              </DialogDescription>
            </DialogHeader>
            <AmountReview
              tone="danger"
              lead="Você vai desfazer o pagamento de"
              cents={payment.amount_cents}
              detail={
                <>
                  recebido em{" "}
                  {new Date(payment.paid_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}, em{" "}
                  {PAYMENT_METHOD_LABEL[payment.method].toLowerCase()}.
                </>
              }
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reason-${payment.id}`}>Por que você está desfazendo?</Label>
              <Textarea
                id={`reason-${payment.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: valor lançado por engano"
                required
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Não, manter pagamento</DialogClose>
              <Button variant="destructive" loading={busy} disabled={!reason.trim()} onClick={handleReverse}>
                Sim, desfazer {formatCentsToBRL(payment.amount_cents)}
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
  chargeLinks,
  lateFeePercent,
  lateInterestMonthlyPercent,
  todayISODate,
  canReverse,
  customerName,
}: {
  customerName?: string
  installment: InstallmentRowData
  payments: PaymentRowData[]
  chargeLinks?: ChargeLinks
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

  const isPayable = PAYABLE_STATUSES.includes(installment.status)
  const isLate = updatedAmountCents > installment.amount_cents

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums">Parcela {installment.number}</span>
          <span className="text-sm text-muted-foreground">{formatISODateToBR(installment.due_date)}</span>
          <StatusBadge status={getInstallmentVisualStatus(installment, todayISODate)} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatCentsToBRL(installment.amount_cents)}</p>
            {isPayable && isLate && (
              <p className="text-xs text-warning tabular-nums">
                com multa e juros: {formatCentsToBRL(updatedAmountCents)}
              </p>
            )}
          </div>
          {isPayable && chargeLinks && <WhatsAppChargeDialog links={chargeLinks} compact />}
          {isPayable && (
            <RegisterPaymentDialog
              installmentId={installment.id}
              installmentNumber={installment.number}
              suggestedAmountCents={suggestedAmountCents}
              customerName={customerName}
            />
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
  contract: { id: string; lateFeePercent: number; lateInterestMonthlyPercent: number; customerName?: string }
  installments: InstallmentRowData[]
  payments: PaymentRowData[]
  chargeLinks: Record<string, ChargeLinks>
  todayISODate: string
  canReverse: boolean
}

function InstallmentsList({ contract, installments, payments, chargeLinks, todayISODate, canReverse }: InstallmentsListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {installments.map((installment) => (
        <InstallmentRow
          key={installment.id}
          installment={installment}
          payments={payments.filter((p) => p.installment_id === installment.id)}
          chargeLinks={chargeLinks[installment.id]}
          lateFeePercent={contract.lateFeePercent}
          lateInterestMonthlyPercent={contract.lateInterestMonthlyPercent}
          todayISODate={todayISODate}
          canReverse={canReverse}
          customerName={contract.customerName}
        />
      ))}
    </ul>
  )
}

export { InstallmentsList }
