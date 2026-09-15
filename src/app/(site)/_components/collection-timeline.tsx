import { renderTemplate } from "@/lib/message-template"
import { Reveal } from "@/components/ui/reveal"

const SAMPLE = { nome: "Maria", valor_parcela: "R$ 250,00", dias_atraso: "5", valor_atualizado: "R$ 262,50" }

const STEPS = [
  {
    label: "Dias antes",
    message: "Oi {{nome}}, aqui é a Atena, do ATLAS. Passando para lembrar: sua parcela de {{valor_parcela}} vence em 2 dias.",
  },
  {
    label: "No dia",
    message: "Oi {{nome}}, hoje vence sua parcela de {{valor_parcela}}. Qualquer coisa, é só chamar.",
  },
  {
    label: "Depois do vencimento",
    message: "Oi {{nome}}, sua parcela está {{dias_atraso}} dias em atraso. Valor atualizado: {{valor_atualizado}}.",
  },
  {
    label: "Renegociação",
    message: "Oi {{nome}}, quer combinar uma nova data para essa parcela? Me chama que a gente resolve.",
  },
  {
    label: "Pagamento confirmado",
    message: "Recebemos seu pagamento de {{valor_parcela}}, {{nome}}. Obrigado!",
  },
]

function CollectionTimeline() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">A cobrança acontece sozinha</h2>
        <p className="mt-2 text-muted-foreground">Do lembrete até a confirmação — cada etapa com a mensagem certa.</p>
      </Reveal>

      <ol className="grid gap-6 lg:grid-cols-5 lg:gap-4">
        {STEPS.map((step, index) => (
          <li key={step.label}>
            <Reveal delay={Math.min(index * 0.08, 0.4)} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </div>
              <div className="rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
                {renderTemplate(step.message, SAMPLE)}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}

export { CollectionTimeline }
