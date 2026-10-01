import {
  MessageCircleIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  CalendarDaysIcon,
  LinkIcon,
  UsersIcon,
  FileBarChart2Icon,
  SmartphoneIcon,
  QrCodeIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Reveal } from "@/components/ui/reveal"
import { SectionHeading } from "@/components/marketing/section-heading"

const FEATURES: { icon: LucideIcon; title: string; description: string; wide?: boolean }[] = [
  {
    icon: MessageCircleIcon,
    title: "Cobrança automática",
    description: "Lembretes, avisos de vencimento e cobrança de atraso pelo WhatsApp, sem você precisar lembrar.",
    wide: true,
  },
  {
    icon: FileTextIcon,
    title: "Contratos e parcelas",
    description: "Carnê gerado sozinho a partir do valor e do número de parcelas.",
  },
  {
    icon: LinkIcon,
    title: "Ficha de cadastro por link",
    description: "Mande um link e o cliente preenche os próprios dados.",
  },
  {
    icon: MessageSquareTextIcon,
    title: "Conversa com a ficha do cliente ao lado",
    description: "Veja contrato, parcelas e histórico sem sair da conversa no WhatsApp.",
    wide: true,
  },
  {
    icon: CalendarDaysIcon,
    title: "Calendário de recebimentos",
    description: "O que já entrou, o que vence e o que está atrasado, dia a dia.",
  },
  {
    icon: UsersIcon,
    title: "Equipe com permissões",
    description: "Dono, gestor e operador — cada um vê e faz só o que pode.",
  },
  {
    icon: FileBarChart2Icon,
    title: "Relatórios em PDF e CSV",
    description: "Extrato por período para conferir ou exportar quando quiser.",
  },
  {
    icon: SmartphoneIcon,
    title: "App no celular",
    description: "Instala na tela inicial e funciona como um aplicativo de verdade.",
  },
  {
    icon: QrCodeIcon,
    title: "Pix direto na cobrança",
    description: "O cliente paga sem sair da conversa — o código já vem com o valor certo, sem passar pelo ATLAS.",
    wide: true,
  },
]

function FeaturesBento() {
  return (
    <section id="recursos" className="scroll-mt-20 border-y border-border bg-background-secondary/60">
      <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28 sm:px-6 lg:px-8">
        <SectionHeading title="Tudo o que você precisa, num lugar só">
          Sem planilha extra, sem caderno, sem WhatsApp Web em dez abas.
        </SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, wide }, index) => {
            // The first feature is the product's core promise: it gets the
            // ink panel; the rest stay quiet on the card surface.
            const featured = index === 0
            return (
              <Reveal
                key={title}
                delay={Math.min(index * 0.05, 0.3)}
                className={cn(
                  "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-colors duration-200",
                  featured
                    ? "border-primary/30 bg-(--ink) text-(--ink-foreground) lg:p-8"
                    : "border-border bg-card hover:border-border-hover",
                  wide && "sm:col-span-2"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    featured ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className={cn("flex flex-col gap-1.5", featured && "mt-auto")}>
                  <h3 className={cn("font-semibold", featured ? "font-display text-2xl" : "text-base")}>{title}</h3>
                  <p className={cn("text-sm", featured ? "max-w-sm text-(--ink-foreground)/70 sm:text-base" : "text-muted-foreground")}>
                    {description}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { FeaturesBento }
