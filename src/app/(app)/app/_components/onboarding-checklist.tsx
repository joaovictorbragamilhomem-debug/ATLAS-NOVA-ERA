import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { isOnboardingComplete, type OnboardingStep } from "@/lib/onboarding/build-onboarding-steps"

function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  if (steps.length === 0 || isOnboardingComplete(steps)) return null

  const doneCount = steps.filter((step) => step.done).length
  const firstPendingId = steps.find((step) => !step.done && !step.locked)?.id

  return (
    <section aria-labelledby="onboarding-title" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="onboarding-title" className="text-lg font-semibold">
            Primeiros passos
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {doneCount} de {steps.length} concluídos
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso dos primeiros passos"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
              aria-hidden="true"
            >
              {step.done ? <CheckIcon className="size-3.5" /> : index + 1}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-col">
                <span className={cn("text-sm font-medium", step.done && "text-muted-foreground line-through")}>
                  {step.title}
                  {step.done && <span className="sr-only"> (concluído)</span>}
                </span>
                {!step.done && (
                  <span className="text-xs text-muted-foreground">
                    {step.locked ? "Cadastre um cliente antes de criar o contrato." : step.description}
                  </span>
                )}
              </div>
              {!step.done && step.href && (
                <div className="flex shrink-0 items-center gap-3">
                  {step.id === "customer" && (
                    <Link
                      href="/app/clientes/importar"
                      className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      Importar planilha
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant={step.id === firstPendingId ? "default" : "secondary"}
                    nativeButton={false}
                    render={<Link href={step.href} />}
                  >
                    {step.ctaLabel}
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export { OnboardingChecklist }
