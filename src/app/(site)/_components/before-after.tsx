import { CheckCircle2Icon } from "lucide-react"

function NotebookMock() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Caderno</p>
      <div className="flex flex-1 flex-col justify-between gap-2 rounded-lg bg-[repeating-linear-gradient(to_bottom,transparent,transparent_19px,var(--border)_20px)] p-3">
        {["Maria - 250 dia 10", "João ligar!!", "Ana atrasou de novo", "??? conferir"].map((line, i) => (
          <span
            key={line}
            className="text-sm text-muted-foreground italic"
            style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)` }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}

function SpreadsheetMock() {
  const cells = Array.from({ length: 12 })
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Planilha</p>
      <div className="grid flex-1 grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {cells.map((_, i) => (
          <div key={i} className="bg-card p-2">
            <div className="h-2 w-3/4 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

function LooseChatsMock() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Conversas soltas</p>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="ml-auto w-2/3 rounded-lg rounded-tr-sm bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          consigo pagar semana que vem?
        </div>
        <div className="w-1/2 rounded-lg rounded-tl-sm bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          quem é vc mesmo?
        </div>
        <div className="ml-auto w-3/5 rounded-lg rounded-tr-sm bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          já paguei ontem!
        </div>
      </div>
    </div>
  )
}

function AtlasPanelMock() {
  const items = [
    "Contratos e parcelas organizados",
    "Cobrança automática no WhatsApp",
    "Um lugar só para a equipe toda",
  ]
  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-xl border border-primary/20 bg-accent p-6">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-accent-foreground">
          <CheckCircle2Icon className="size-4.5 shrink-0" aria-hidden="true" />
          {item}
        </div>
      ))}
    </div>
  )
}

function BeforeAfter() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Chega de juntar as pontas</h2>
        <p className="mt-2 text-muted-foreground">
          Caderno, planilha e mensagens soltas viram um único painel — sem perder cliente no meio
          do caminho.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <NotebookMock />
          <SpreadsheetMock />
          <LooseChatsMock />
        </div>

        <div className="hidden justify-center lg:flex">
          <span className="text-sm font-medium text-muted-foreground">→</span>
        </div>

        <AtlasPanelMock />
      </div>
    </section>
  )
}

export { BeforeAfter }
