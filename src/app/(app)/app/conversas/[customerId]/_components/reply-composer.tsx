"use client"

import { useActionState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { sendReplyAction, type ReplyActionState } from "@/lib/whatsapp/reply-actions"

function ReplyComposer({ customerId, withinWindow }: { customerId: string; withinWindow: boolean }) {
  const boundAction = sendReplyAction.bind(null, customerId) as (
    state: ReplyActionState,
    formData: FormData
  ) => Promise<ReplyActionState>
  const [state, formAction, pending] = useActionState(boundAction, { error: null } as ReplyActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset()
  }, [pending, state.error])

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
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea name="body" placeholder="Escreva uma resposta..." required rows={2} />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-fit self-end">
        Enviar
      </Button>
    </form>
  )
}

export { ReplyComposer }
