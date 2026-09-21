"use client"

import * as React from "react"
import { useActionState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCentsToBRL, formatISODateToBR } from "@/lib/masks"
import { sendReplyAction, generatePixMessageAction, type ReplyActionState } from "@/lib/whatsapp/reply-actions"
import type { OpenInstallmentOption } from "@/lib/installments/get-open-installments-for-customer"

function ReplyComposer({
  customerId,
  withinWindow,
  openInstallments,
}: {
  customerId: string
  withinWindow: boolean
  openInstallments: OpenInstallmentOption[]
}) {
  const boundAction = sendReplyAction.bind(null, customerId) as (
    state: ReplyActionState,
    formData: FormData
  ) => Promise<ReplyActionState>
  const [state, formAction, pending] = useActionState(boundAction, { error: null } as ReplyActionState)
  const [body, setBody] = React.useState("")
  const [selectedInstallment, setSelectedInstallment] = React.useState("")
  const [generatingPix, setGeneratingPix] = React.useState(false)
  const [pixError, setPixError] = React.useState<string | null>(null)

  // Limpa o campo assim que o envio termina com sucesso — ajustando o
  // estado durante a renderização (comparando com o "pending" anterior),
  // em vez de um useEffect, pra não disparar uma renderização em cascata.
  const [prevPending, setPrevPending] = React.useState(pending)
  if (pending !== prevPending) {
    setPrevPending(pending)
    if (!pending && !state.error) setBody("")
  }

  async function handleGeneratePix() {
    if (!selectedInstallment) return
    setGeneratingPix(true)
    setPixError(null)
    const result = await generatePixMessageAction(selectedInstallment)
    setGeneratingPix(false)
    if ("error" in result) setPixError(result.error)
    else setBody(result.body)
  }

  if (!withinWindow) {
    return (
      <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
        Essa conversa está fora da janela de 24h da Meta — para reiniciar, envie um modelo aprovado na aba{" "}
        <a href="/app/whatsapp" className="underline underline-offset-2">
          WhatsApp
        </a>
        .
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {openInstallments.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-2">
          <div className="flex flex-1 flex-col gap-1">
            <Select value={selectedInstallment} onValueChange={(value) => setSelectedInstallment(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma parcela em aberto">
                  {(value: string) => {
                    const installment = openInstallments.find((i) => i.id === value)
                    return installment
                      ? `${formatCentsToBRL(installment.remainingCents)} · vence ${formatISODateToBR(installment.dueDate)}`
                      : "Escolha uma parcela em aberto"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {openInstallments.map((installment) => (
                  <SelectItem key={installment.id} value={installment.id}>
                    {formatCentsToBRL(installment.remainingCents)} · vence {formatISODateToBR(installment.dueDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={generatingPix}
            disabled={!selectedInstallment}
            onClick={handleGeneratePix}
          >
            Gerar código Pix
          </Button>
        </div>
      )}
      <FormError message={pixError} />

      <Textarea
        name="body"
        placeholder="Escreva uma resposta..."
        required
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <FormError message={state.error} />
      <Button type="submit" loading={pending} className="w-fit self-end">
        Enviar
      </Button>
    </form>
  )
}

export { ReplyComposer }
