import Link from "next/link"

const LINKS = [
  { href: "/app", label: "Início" },
  { href: "/app/clientes", label: "Clientes" },
  { href: "/app/fichas", label: "Fichas" },
  { href: "/app/calendario", label: "Calendário" },
  { href: "/app/relatorios", label: "Relatórios" },
  { href: "/app/whatsapp", label: "WhatsApp" },
  { href: "/app/equipe", label: "Equipe" },
  { href: "/app/assinatura", label: "Assinatura" },
]

function AppNav() {
  return (
    <nav className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export { AppNav }
