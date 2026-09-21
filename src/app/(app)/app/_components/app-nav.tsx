import Link from "next/link"
import { SearchIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const LINKS = [
  { href: "/app", label: "Início" },
  { href: "/app/clientes", label: "Clientes" },
  { href: "/app/fichas", label: "Fichas" },
  { href: "/app/calendario", label: "Calendário" },
  { href: "/app/relatorios", label: "Relatórios" },
  { href: "/app/whatsapp", label: "WhatsApp" },
  { href: "/app/conversas", label: "Conversas" },
  { href: "/app/equipe", label: "Equipe" },
  { href: "/app/assinatura", label: "Assinatura" },
]

function AppNav() {
  return (
    <nav className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-1 overflow-x-auto sm:gap-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-4"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <form action="/app/clientes" className="hidden shrink-0 sm:block">
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="busca"
              placeholder="Buscar cliente…"
              className="h-9 w-44 rounded-lg border border-input bg-transparent pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
        </form>
        <ThemeToggle className="shrink-0" />
      </div>
    </nav>
  )
}

export { AppNav }
