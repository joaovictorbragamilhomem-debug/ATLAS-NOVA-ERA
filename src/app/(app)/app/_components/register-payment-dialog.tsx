"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { registerInstallmentPaymentAction } from "@/lib/installments/actions"

export type PaymentMethod = "pix" | "dinheiro" | "transferencia" | "cartao"

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
}

type RegisterPaymentDialogProps = {
  installmentId: string
  installmentNumber: number
  suggestedAmountCents: number
  triggerLabel?: string
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
}

function RegisterPaymentDialog({
  installmentId,
  installmentNumber,
  suggestedAmountCents,
  triggerLabel = "Dar baixa",
  triggerVariant,
}: RegisterPaymentDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [amountCents, setAmountCents] = React.useState(suggestedAmountCents)
  const [method, setMethod] = React.useState<PaymentMethod>("pix")
  const [busy, setBusy] = React.useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setAmountCents(suggestedAmountCents)
  }

  async function handleConfirm() {
    setBusy(true)
    const result = await registerInstallmentPaymentAction(installmentId, amountCents, method)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Baixa registrada.")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar baixa — parcela {installmentNumber}</DialogTitle>
          <DialogDescription>Confirme o valor recebido e a forma de pagamento.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`amount-${installmentId}`}>Valor recebido</Label>
            <CurrencyInput id={`amount-${installmentId}`} value={amountCents} onValueChange={setAmountCents} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`method-${installmentId}`}>Forma de pagamento</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger id={`method-${installmentId}`} className="w-full">
                <SelectValue>{(value: PaymentMethod) => PAYMENT_METHOD_LABEL[value]}</SelectValue>
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
  )
}

export { RegisterPaymentDialog }
