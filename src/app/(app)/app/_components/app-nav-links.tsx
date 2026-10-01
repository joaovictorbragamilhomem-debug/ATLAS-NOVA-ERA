"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

// Most-used screens first: on a phone only the first few fit without
// scrolling sideways, so the daily tasks (home, customers, due dates,
// messages) must be the ones that show up.
const LINKS = [
  { href: "/app", label: "Início" },
  { href: "/app/clientes", label: "Clientes" },
  { href: "/app/calendario", label: "Vencimentos" },
  { href: "/app/conversas", label: "Conversas" },
  { href: "/app/whatsapp", label: "WhatsApp" },
  { href: "/app/relatorios", label: "Relatórios" },
  { href: "/app/fichas", label: "Fichas" },
  { href: "/app/equipe", label: "Equipe" },
  { href: "/app/assinatura", label: "Assinatura" },
]

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function AppNavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-4",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}

export { AppNavLinks }
