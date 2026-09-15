import { Reveal } from "@/components/ui/reveal"

const PROFILES = [
  "Quem vende no crediário",
  "Pequenos negócios que parcelam",
  "Empresas Simples de Crédito (ESC)",
  "Financeiras locais",
  "Correspondentes de crédito",
]

function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Para quem é o ATLAS</h2>
      </Reveal>
      <div className="flex flex-wrap justify-center gap-2.5">
        {PROFILES.map((profile, index) => (
          <Reveal
            key={profile}
            delay={Math.min(index * 0.03, 0.15)}
            y={8}
            className="rounded-4xl border border-border bg-card px-4 py-2 text-sm font-medium"
          >
            {profile}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export { Audience }
