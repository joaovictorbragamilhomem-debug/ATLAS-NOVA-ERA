import { CheckCircle2Icon } from "lucide-react"

function ProblemCopy() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 rounded-xl border border-border bg-card p-6">
      <p className="text-base font-semibold text-foreground">
        Desorganização financeira não é só estresse — é dinheiro que deixa de entrar.
      </p>
      <p className="text-sm text-muted-foreground">
        Parcela que atrasa e ninguém percebe a tempo. Cliente que “esquece” porque
        também ninguém lembrou ele. E a cobrança que sobra pra você mandar, com seu
        número e seu nome, toda vez — virando “aquele que fica cobrando”.
      </p>
      <p className="text-sm text-muted-foreground">
        O ATLAS assume essa parte: os lembretes e avisos de vencimento saem sozinhos
        pelo WhatsApp, como um assistente virtual da sua empresa — não pelo seu
        número pessoal.
      </p>
      <p className="text-sm text-muted-foreground">
        Você para de gastar seu tempo correndo atrás de gente e volta a gastar ele no
        que importa: o seu negócio.
      </p>
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
        <ProblemCopy />

        <div className="hidden justify-center lg:flex">
          <span className="text-sm font-medium text-muted-foreground">→</span>
        </div>

        <AtlasPanelMock />
      </div>
    </section>
  )
}

export { BeforeAfter }
