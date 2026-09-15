import { ShieldCheckIcon, FileCheck2Icon, HistoryIcon, LandmarkIcon } from "lucide-react"
import { Reveal } from "@/components/ui/reveal"

const ITEMS = [
  {
    icon: ShieldCheckIcon,
    title: "Cada conta só vê os próprios dados",
    description: "Sua carteira de clientes fica isolada da de qualquer outra empresa que usa o ATLAS.",
  },
  {
    icon: FileCheck2Icon,
    title: "Consentimento registrado",
    description: "Data, hora e versão do termo aceito ficam guardados junto com a ficha do cliente.",
  },
  {
    icon: HistoryIcon,
    title: "Histórico de quem fez o quê",
    description: "Toda alteração importante — criar, editar, dar baixa, estornar — fica auditada.",
  },
  {
    icon: LandmarkIcon,
    title: "Não somos um banco",
    description: "O ATLAS registra, calcula e ajuda a cobrar. Não empresta nem movimenta dinheiro de ninguém.",
  },
]

function SecurityLgpd() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Segurança e LGPD, desde o início</h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, description }, index) => (
            <Reveal
              key={title}
              delay={Math.min(index * 0.06, 0.3)}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export { SecurityLgpd }
