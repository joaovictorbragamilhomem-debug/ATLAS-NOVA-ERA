import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

type TransactionRowProps = {
  icon: LucideIcon
  label: string
  meta: string
  amount: string
  tone: "debit" | "credit"
  active: boolean
  delayMs?: number
}

// Uma linha do "extrato" do cliente dentro do mockup do Hero. Fica sempre
// montada (opacity/transform, nunca display:none) pra a entrada com leve
// overshoot poder tocar de novo a cada ciclo sem depender de remount.
function TransactionRow({ icon: Icon, label, meta, amount, tone, active, delayMs = 0 }: TransactionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.4,0.44,1)]",
        active ? "translate-y-0 scale-100 opacity-100" : "translate-y-3.5 scale-[0.97] opacity-0"
      )}
      style={{ transitionDelay: active && delayMs ? `${delayMs}ms` : "0ms" }}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          tone === "debit" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium">{label}</span>
        <span className="text-[0.65rem] text-muted-foreground">{meta}</span>
      </div>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          tone === "debit" ? "text-[#B91C1C]" : "text-accent-foreground"
        )}
      >
        {amount}
      </span>
    </div>
  )
}

export { TransactionRow }
