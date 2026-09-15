import { cn } from "cn"
import type { DemoPhase } from "./use-hero-demo"

const STEPS = ["Venda", "Lembre", "Receba"] as const

function HeroStepper({ phase }: { phase: DemoPhase }) {
  return (
    <div className="flex items-center gap-1 rounded-4xl border border-border bg-card p-1 shadow-sm">
      {STEPS.map((label, index) => (
        <span
          key={label}
          className={cn(
            "flex items-center gap-1.5 rounded-4xl px-2.5 py-1 text-[0.7rem] font-semibold transition-colors duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
            phase === index ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full text-[0.6rem]",
              phase === index ? "bg-white/20" : "bg-muted"
            )}
          >
            {index + 1}
          </span>
          {label}
        </span>
      ))}
    </div>
  )
}

export { HeroStepper }
