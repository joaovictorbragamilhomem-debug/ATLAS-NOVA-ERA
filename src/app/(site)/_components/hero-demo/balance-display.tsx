import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { formatCentsToBRL } from "@/lib/masks"
import { DEMO_AMOUNT_CENTS } from "./demo-data"

// Crossfade entre o saldo devedor (vermelho) e quitado (verde) — o clímax
// visual da timeline. Os dois valores ficam sempre montados, um por cima do
// outro, só opacity/scale trocam.
//
// Importante: o easing com overshoot (usado nas entradas do extrato) NÃO
// serve pra um fade-out de opacity — a curva ultrapassa o alvo e o navegador
// trava em 0, então o elemento "chega" no fim bem antes da duração nominal e
// passa o resto do tempo parado, invisível. Isso abria um vão em branco
// entre o vermelho sumir e o verde começar a entrar. Por isso aqui os dois
// lados usam um ease-out comum (sem overshoot), com uma pequena sobreposição
// no meio pra garantir que nunca fique sem nenhum valor visível.
function BalanceDisplay({ settled }: { settled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5">
      <span className="text-[0.7rem] font-medium text-muted-foreground">Saldo do cliente</span>
      <span className="relative flex h-5 min-w-24 items-center justify-end">
        <span
          className={cn(
            "absolute right-0 text-sm font-bold tabular-nums text-[#B91C1C] transition-[opacity,transform] duration-[260ms] ease-out",
            settled ? "scale-[0.9] opacity-0" : "scale-100 opacity-100"
          )}
        >
          {formatCentsToBRL(DEMO_AMOUNT_CENTS)}
        </span>
        <span
          className={cn(
            "absolute right-0 flex items-center gap-1 text-sm font-bold tabular-nums text-accent-foreground transition-[opacity,transform] duration-[380ms] ease-out",
            settled ? "scale-100 opacity-100" : "scale-[0.9] opacity-0"
          )}
          style={{ transitionDelay: settled ? "220ms" : "0ms" }}
        >
          {formatCentsToBRL(0)}
          <CheckIcon className="size-3.5" aria-hidden="true" />
        </span>
      </span>
    </div>
  )
}

export { BalanceDisplay }
