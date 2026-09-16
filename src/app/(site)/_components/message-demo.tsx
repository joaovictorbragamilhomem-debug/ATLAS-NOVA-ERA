"use client"

import * as React from "react"
import { AlertTriangleIcon, CheckCheckIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Reveal } from "@/components/ui/reveal"
import {
  renderTemplate,
  extractTemplateVariables,
  KNOWN_TEMPLATE_VARIABLES,
} from "@/lib/message-template"

const DEFAULT_TEMPLATE =
  "Oi {{nome}}, tudo bem? Aqui é a Atena, do ATLAS 🙂 Sua parcela de {{valor_parcela}} vence em {{vencimento}}. Se já pagou, pode ignorar."

const SAMPLE_DATA = {
  nome: "Carlos",
  empresa: "Crédito da Vila",
  valor_parcela: "R$ 180,00",
  numero_parcela: "4/10",
  vencimento: "16/09/2026",
  dias_atraso: "3",
  valor_atualizado: "R$ 187,40",
  saldo_restante: "R$ 1.080,00",
  chave_pix: "11999998888",
  atendente: "Fernanda",
}

function MessageDemo() {
  const [template, setTemplate] = React.useState(DEFAULT_TEMPLATE)

  const usedVariables = React.useMemo(() => extractTemplateVariables(template), [template])
  const invalidVariables = usedVariables.filter(
    (v) => !(KNOWN_TEMPLATE_VARIABLES as readonly string[]).includes(v)
  )
  const preview = renderTemplate(template, SAMPLE_DATA)

  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Escreva do seu jeito, com suas variáveis</h2>
          <p className="mt-2 text-muted-foreground">
            Apresentamos a <strong className="text-foreground">Atena</strong> — é o nome que demos para a
            cobrança automática, pra ficar mais simpático que uma mensagem de robô. Edite o modelo abaixo e veja,
            ao lado, como o cliente recebe no WhatsApp.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="message-demo-editor">Modelo de mensagem</Label>
          <Textarea
            id="message-demo-editor"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {KNOWN_TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTemplate((t) => `${t}{{${v}}}`)}
                className="rounded-4xl border border-border bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
          {invalidVariables.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangleIcon className="size-3.5 shrink-0" aria-hidden="true" />
              Variável desconhecida: {invalidVariables.map((v) => `{{${v}}}`).join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-xs flex-col gap-1 rounded-2xl border border-border bg-success-soft p-4">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-card px-3 py-2 text-sm shadow-sm">
              {preview}
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                09:14 <CheckCheckIcon className="size-3 text-primary" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  )
}

export { MessageDemo }
