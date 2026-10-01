import { SearchIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AppNavLinks } from "./app-nav-links"

function AppNav() {
  return (
    <nav aria-label="Menu principal" className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4">
        <AppNavLinks />
        <form action="/app/clientes" className="hidden shrink-0 xl:block">
          <label className="relative block">
            <span className="sr-only">Buscar cliente</span>
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
