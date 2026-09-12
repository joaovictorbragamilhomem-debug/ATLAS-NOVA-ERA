"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCentsToBRL } from "@/lib/masks"
import { Skeleton } from "@/components/ui/skeleton"

function PanelPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["A receber no mês", formatCentsToBRL(1248000)],
        ["Recebido no mês", formatCentsToBRL(860000)],
        ["Em atraso", formatCentsToBRL(32000)],
      ].map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}

function CustomersPreview() {
  return (
    <div className="flex flex-col gap-2">
      {["Maria Souza", "João Pereira", "Ana Lima"].map((name) => (
        <div key={name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {name[0]}
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium">{name}</span>
            <Skeleton className="mt-1 h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CollectionsPreview() {
  return (
    <div className="flex flex-col gap-2">
      {[
        ["Carlos Dias", "vence_hoje"],
        ["Fernanda Melo", "atrasada"],
        ["Pedro Alves", "paga"],
      ].map(([name, status]) => (
        <div key={name} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <span className="text-sm font-medium">{name}</span>
          <StatusBadge status={status as "vence_hoje" | "atrasada" | "paga"} />
        </div>
      ))}
    </div>
  )
}

function ConversationsPreview() {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
      <div className="w-2/3 rounded-lg rounded-tl-sm bg-muted px-2.5 py-1.5 text-xs">Oi, posso pagar amanhã?</div>
      <div className="ml-auto w-1/2 rounded-lg rounded-tr-sm bg-accent px-2.5 py-1.5 text-xs text-accent-foreground">
        Pode sim! Te aviso por aqui.
      </div>
    </div>
  )
}

const TABS = [
  { value: "painel", label: "Painel", content: PanelPreview },
  { value: "clientes", label: "Clientes", content: CustomersPreview },
  { value: "cobrancas", label: "Cobranças", content: CollectionsPreview },
  { value: "conversas", label: "Conversas", content: ConversationsPreview },
]

function ProductTour() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Conheça o painel</h2>
        <p className="mt-2 text-muted-foreground">
          Prévia ilustrativa das telas — capturas reais do sistema entram aqui assim que o produto
          estiver pronto.
        </p>
      </div>

      <Tabs defaultValue="painel" className="mx-auto max-w-3xl">
        <TabsList className="mx-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="rounded-xl border border-border bg-muted/40 p-4">
            <tab.content />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

export { ProductTour }
