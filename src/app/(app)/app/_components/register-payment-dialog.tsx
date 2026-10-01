"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/masked-input"
import { AmountReview } from "@/components/ui/amount-review"
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
import { formatCentsToBRL } from "@/lib/masks"
import { centsToWordsSentenceBR } from "@/lib/money-in-words"

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
  /** Shown in the review step ("pago por João") so the person checks who paid. */
  customerName?: string
  triggerLabel?: string
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
}

type Step = "fill" | "review"

// Two steps on purpose: first the person types the amount, then a review
// screen repeats it in big numbers and in words before anything is saved —
// with large sums, one extra zero must be caught before it hits the books.
function RegisterPaymentDialog({
  installmentId,
  installmentNumber,
  suggestedAmountCents,
  customerName,
  triggerLabel = "Registrar pagamento",
  triggerVariant,
}: RegisterPaymentDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>("fill")
  const [amountCents, setAmountCents] = React.useState(suggestedAmountCents)
  const [method, setMethod] = React.useState<PaymentMethod>("pix")
  const [busy, setBusy] = React.useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setAmountCents(suggestedAmountCents)
      setStep("fill")
    }
  }

  async function handleConfirm() {
    setBusy(true)
    const result = await registerInstallmentPaymentAction(installmentId, amountCents, method)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Pagamento de ${formatCentsToBRL(amountCents)} registrado.`)
    setOpen(false)
  }

  const differenceCents = amountCents - suggestedAmountCents
  const isPartial = suggestedAmountCents > 0 && differenceCents < 0
  const isOverpaid = suggestedAmountCents > 0 && differenceCents > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        {step === "fill" ? (
          <>
            <DialogHeader>
              <DialogTitle>Registrar pagamento — parcela {installmentNumber}</DialogTitle>
              <DialogDescription>
                {customerName ? `Quanto ${customerName} pagou? ` : "Quanto o cliente pagou? "}
                Valor em aberto nesta parcela: <strong>{formatCentsToBRL(suggestedAmountCents)}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`amount-${installmentId}`}>Valor recebido</Label>
                <CurrencyInput
                  id={`amount-${installmentId}`}
                  value={amountCents}
                  onValueChange={setAmountCents}
                  className="h-12 text-lg font-semibold tabular-nums md:h-11 md:text-lg"
                />
                {amountCents > 0 && (
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    {centsToWordsSentenceBR(amountCents)}
                  </p>
                )}
                {amountCents !== suggestedAmountCents && suggestedAmountCents > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto self-start px-0"
                    onClick={() => setAmountCents(suggestedAmountCents)}
                  >
                    Usar o valor total em aberto ({formatCentsToBRL(suggestedAmountCents)})
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`method-${installmentId}`}>Como o cliente pagou?</Label>
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
              <Button disabled={amountCents <= 0} onClick={() => setStep("review")}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confira antes de salvar</DialogTitle>
              <DialogDescription>Se algo estiver errado, toque em &ldquo;Voltar e corrigir&rdquo;.</DialogDescription>
            </DialogHeader>
            <AmountReview
              lead="Você vai registrar que recebeu"
              cents={amountCents}
              detail={
                <>
                  {customerName ? (
                    <>
                      pago por <strong>{customerName}</strong>,{" "}
                    </>
                  ) : null}
                  parcela {installmentNumber}, em {PAYMENT_METHOD_LABEL[method].toLowerCase()}.
                </>
              }
            />
            {isPartial && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Pagamento parcial: ainda vão faltar <strong>{formatCentsToBRL(-differenceCents)}</strong> nesta
                  parcela.
                </span>
              </p>
            )}
            {isOverpaid && (
              <p className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Atenção: esse valor é <strong>{formatCentsToBRL(differenceCents)} a mais</strong> do que o valor
                  em aberto ({formatCentsToBRL(suggestedAmountCents)}). Confira se digitou certo.
                </span>
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("fill")} disabled={busy}>
                Voltar e corrigir
              </Button>
              <Button loading={busy} onClick={handleConfirm}>
                Sim, registrar {formatCentsToBRL(amountCents)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { RegisterPaymentDialog }
