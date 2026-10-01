import { renderTemplate } from "@/lib/message-template"
import { Reveal } from "@/components/ui/reveal"
import { DrawLine } from "@/components/marketing/draw-line"
import { SectionHeading } from "@/components/marketing/section-heading"

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
    <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28 sm:px-6 lg:px-8">
      <SectionHeading title="A cobrança acontece sozinha">
        Do lembrete até a confirmação — cada etapa com a mensagem certa.
      </SectionHeading>

      <div className="relative">
        {/* The route the collection travels, drawn across the five steps. */}
        <DrawLine className="absolute top-4 right-[calc((100%-5rem)/5-1rem)] left-4 hidden lg:block" />
        <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-5">
          {STEPS.map((step, index) => (
            <li key={step.label} className="relative">
              {index < STEPS.length - 1 && (
                <span aria-hidden className="absolute top-8 bottom-[-2rem] left-4 w-px bg-border lg:hidden" />
              )}
              <Reveal delay={Math.min(index * 0.12, 0.6)} className="flex gap-4 lg:flex-col">
                <div className="flex items-start">
                  <span
                    className={
                      index === STEPS.length - 1
                        ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground"
                        : "flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background font-display text-sm font-semibold text-foreground"
                    }
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 lg:gap-4">
                  <span className="text-sm font-semibold max-lg:pt-1.5">{step.label}</span>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground shadow-sm">
                    {renderTemplate(step.message, SAMPLE)}
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export { CollectionTimeline }
