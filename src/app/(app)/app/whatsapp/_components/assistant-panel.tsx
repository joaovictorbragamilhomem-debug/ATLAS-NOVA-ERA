"use client"

import * as React from "react"
import { toast } from "sonner"
import { BotIcon, CheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setAssistantEnabledAction } from "@/lib/assistant/actions"

const DOES = [
  "Reenvia o Pix com o valor certo quando o cliente pede",
  "Anota quando o cliente promete pagar (“pago sexta”) e lembra ele nesse dia",
  "Quando o cliente diz que já pagou, pede o comprovante e avisa você",
  "Responde só das 8h às 20h — quem escreve de madrugada recebe a resposta de manhã",
]

const NEVER = [
  "Ameaçar, constranger ou falar com outras pessoas",
  "Dar desconto ou mudar parcelas — isso ele passa para você",
  "Falar de outro assunto que não as parcelas do cliente",
]

function AssistantPanel({
  enabled,
  canEdit,
  modelConfigured,
  connected,
  hasPix,
}: {
  enabled: boolean
  canEdit: boolean
  modelConfigured: boolean
  connected: boolean
  hasPix: boolean
}) {
  const [pending, startTransition] = React.useTransition()

  function toggle() {
    startTransition(async () => {
      const result = await setAssistantEnabledAction(!enabled)
      if (result.error) toast.error(result.error)
      else toast.success(enabled ? "Assistente desligado." : "Assistente ligado.")
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <BotIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">Assistente de cobrança</h2>
            <p className="text-sm text-muted-foreground">
              Responde por você quando o cliente escreve no WhatsApp da loja — sem você precisar falar de dinheiro.
              Você acompanha tudo em Conversas e pode assumir a qualquer momento: se alguém da equipe responder, o
              assistente fica em silêncio nessa conversa.
            </p>
          </div>
        </div>

        <p className="text-sm font-medium">
          Situação:{" "}
          <span className={enabled ? "text-success" : "text-muted-foreground"}>{enabled ? "ligado" : "desligado"}</span>
        </p>

        {!connected && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            Conecte o WhatsApp na aba Conexão — sem isso o assistente não consegue responder.
          </p>
        )}
        {connected && !hasPix && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            Cadastre sua chave Pix na aba Conexão para o assistente poder mandar o código de pagamento.
          </p>
        )}
        {!modelConfigured && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            A inteligência artificial ainda não foi ativada no servidor. Fale com o suporte do ATLAS.
          </p>
        )}

        {canEdit ? (
          <Button type="button" variant={enabled ? "outline" : "primary"} loading={pending} onClick={toggle} className="w-full sm:w-fit">
            {enabled ? "Desligar assistente" : "Ligar assistente"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Só o Dono da conta pode ligar ou desligar o assistente.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">O que ele faz sozinho</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {DOES.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">O que ele nunca faz</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {NEVER.map((item) => (
              <li key={item} className="flex gap-2">
                <XIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Para escrever as respostas, as mensagens do cliente e os dados das parcelas dele são processados por uma
        inteligência artificial (Anthropic). O CPF e o endereço do cliente não são enviados.
      </p>
    </div>
  )
}

export { AssistantPanel }
