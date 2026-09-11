import { ShieldCheckIcon, FileCheck2Icon, HistoryIcon, LandmarkIcon } from "lucide-react"

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
    <section className="cv-auto mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Segurança e LGPD, desde o início</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { SecurityLgpd }
