import { CheckIcon } from "lucide-react"
import { cn } from "cn"

type StepperProps = {
  steps: string[]
  currentStep: number
  className?: string
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-start", className)}>
      {steps.map((label, index) => {
        const state = index < currentStep ? "done" : index === currentStep ? "current" : "upcoming"
        const isLast = index === steps.length - 1

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  state === "done" && "bg-primary text-primary-foreground",
                  state === "current" && "bg-primary/10 text-primary ring-2 ring-primary",
                  state === "upcoming" && "bg-muted text-muted-foreground"
                )}
                aria-current={state === "current" ? "step" : undefined}
              >
                {state === "done" ? <CheckIcon className="size-4" aria-hidden="true" /> : index + 1}
              </div>
              <span
                className={cn(
                  "max-w-24 text-center text-xs font-medium",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 mb-6 h-px flex-1",
                  state === "done" ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
