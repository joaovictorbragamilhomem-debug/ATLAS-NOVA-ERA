"use client"

import * as React from "react"
import { toast } from "sonner"
import { BellRingIcon, BellOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearCustomerOptOutAction, resolveAssistantAlertsAction } from "@/lib/assistant/actions"
import type { AssistantConversationState } from "@/lib/assistant/conversation-state"

// What the collections assistant needs from the team in this conversation.
function AssistantBanner({
  customerId,
  state,
  canClearOptOut,
}: {
  customerId: string
  state: AssistantConversationState
  canClearOptOut: boolean
}) {
  const [pending, startTransition] = React.useTransition()
  const actionableAlerts = state.openAlerts.filter((a) => a.kind !== "opt_out")

  if (actionableAlerts.length === 0 && !state.optedOutAt) return null

  function resolve() {
    startTransition(async () => {
      const result = await resolveAssistantAlertsAction(customerId)
      if (result.error) toast.error(result.error)
      else toast.success("Pronto — o assistente volta a responder esse cliente.")
    })
  }

  function clearOptOut() {
    startTransition(async () => {
      const result = await clearCustomerOptOutAction(customerId)
      if (result.error) toast.error(result.error)
      else toast.success("As mensagens automáticas voltam a ser enviadas para esse cliente.")
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {actionableAlerts.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-warning">
            <BellRingIcon className="size-4" aria-hidden="true" /> O assistente passou esta conversa para você
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {actionableAlerts.map((alert) => (
              <li key={alert.id}>{alert.reason}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Enquanto isso, ele não responde esse cliente. Ao responder você mesmo, ou tocar em “Resolvido”, ele volta a
            ajudar.
          </p>
          <Button type="button" variant="outline" loading={pending} onClick={resolve} className="w-full sm:w-fit">
            Resolvido
          </Button>
        </div>
      )}

      {state.optedOutAt && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <BellOffIcon className="size-4" aria-hidden="true" /> Cliente pediu para não receber mensagens automáticas
          </p>
          <p className="text-muted-foreground">
            Desde {new Date(state.optedOutAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}, nenhum
            lembrete automático é enviado para ele. Você ainda pode responder quando ele escrever.
          </p>
          {canClearOptOut && (
            <Button type="button" variant="outline" loading={pending} onClick={clearOptOut} className="w-full sm:w-fit">
              Ele pediu para voltar a receber
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { AssistantBanner }
