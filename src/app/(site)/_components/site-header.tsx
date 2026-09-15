"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#precos", label: "Preços" },
  { href: "#duvidas", label: "Dúvidas" },
]

function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" prefetch={false} className="text-base font-semibold tracking-tight">
          ATLAS <span className="text-primary">NOVA ERA</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 hover:text-foreground hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/app" prefetch={false} />} className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/app" prefetch={false} />}>
            Testar grátis
          </Button>
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
