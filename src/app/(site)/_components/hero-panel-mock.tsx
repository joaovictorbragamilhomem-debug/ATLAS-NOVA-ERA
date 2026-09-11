import { CheckCheckIcon, MessageCircleReplyIcon, WalletIcon } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCentsToBRL } from "@/lib/masks"

const ROWS = [
  { name: "Maria Souza", due: "Vence hoje", amount: 25000, status: "vence_hoje" as const },
  { name: "João Pereira", due: "10/09", amount: 48000, status: "a_vencer" as const },
  { name: "Ana Lima", due: "Atrasada há 3 dias", amount: 32000, status: "atrasada" as const },
]

const NOTIFICATIONS = [
  { icon: CheckCheckIcon, text: "Lembrete enviado para Ana Lima" },
  { icon: MessageCircleReplyIcon, text: "Cliente respondeu no WhatsApp" },
  { icon: WalletIcon, text: "Pagamento registrado — R$ 250,00" },
]

// Mock feito só em HTML/CSS (sem imagem). As notificações aparecem em
// sequência com um atraso por item, puramente via CSS — continua
// funcionando mesmo que o JavaScript não carregue.
function HeroPanelMock() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:pb-24">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-5">
        <div className="flex items-center gap-1.5 pb-4">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2 pb-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">A receber este mês</p>
            <p className="text-lg font-semibold tabular-nums">{formatCentsToBRL(1248000)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Em atraso</p>
            <p className="text-lg font-semibold tabular-nums text-[#B91C1C]">{formatCentsToBRL(32000)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {ROWS.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{row.name}</span>
                <span className="text-xs text-muted-foreground">{row.due}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">{formatCentsToBRL(row.amount)}</span>
                <StatusBadge status={row.status} className="px-2 py-0.5 text-[0.65rem]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:absolute sm:right-0 sm:bottom-0 sm:mt-0 sm:w-64">
        {NOTIFICATIONS.map(({ icon: Icon, text }, index) => (
          <div
            key={text}
            className="animate-fade-in flex items-center gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-xs font-medium shadow-md [animation-duration:400ms] [animation-fill-mode:both]"
            style={{ animationDelay: `${index * 0.9 + 0.3}s` }}
          >
            <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}

export { HeroPanelMock }
