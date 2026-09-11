import {
  MessageCircleIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  CalendarDaysIcon,
  LinkIcon,
  UsersIcon,
  FileBarChart2Icon,
  SmartphoneIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

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
]

function FeaturesBento() {
  return (
    <section id="recursos" className="cv-auto mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Tudo o que você precisa, num lugar só</h2>
        <p className="mt-2 text-muted-foreground">Sem planilha extra, sem caderno, sem WhatsApp Web em dez abas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description, wide }) => (
          <div
            key={title}
            className={cn(
              "flex flex-col gap-3 rounded-xl border border-border bg-card p-5",
              wide && "sm:col-span-2"
            )}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { FeaturesBento }
