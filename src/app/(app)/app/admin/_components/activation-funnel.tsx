import type { ActivationStage } from "@/lib/admin/build-activation-funnel"

function ActivationFunnel({ stages }: { stages: ActivationStage[] }) {
  const signups = stages[0]?.count ?? 0

  return (
    <section aria-labelledby="activation-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="activation-title" className="text-lg font-semibold">
          Ativação das contas
        </h2>
        <p className="text-sm text-muted-foreground">
          Quantas contas chegaram a cada marco. Cada marco é contado por conta, sem exigir os anteriores.
          “Assinaram” só conta cobranças feitas pelo Asaas; contas ativadas à mão no painel não entram.
        </p>
      </div>

      {signups === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conta ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          {stages.map((stage) => (
            <li key={stage.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{stage.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {stage.count} de {signups} · {stage.percentOfSignups}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${stage.percentOfSignups ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export { ActivationFunnel }
