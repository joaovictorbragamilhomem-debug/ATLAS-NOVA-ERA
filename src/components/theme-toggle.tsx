"use client"

import * as React from "react"
import { MonitorIcon, SunIcon, MoonIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "cn"

const OPTIONS = [
  { value: "system", label: "Sistema", icon: MonitorIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
] as const

function subscribeNever() {
  return () => {}
}
function getMountedSnapshot() {
  return true
}
function getMountedServerSnapshot() {
  return false
}

// Mesma técnica de useReducedMotionSafe (ver use-hero-demo.ts): o valor
// persistido do tema só existe no cliente, então nenhuma opção pode aparecer
// "ativa" durante a hidratação — useSyncExternalStore resolve isso sem cair
// no anti-padrão de chamar setState dentro de um efeito.
function useMounted(): boolean {
  return React.useSyncExternalStore(subscribeNever, getMountedSnapshot, getMountedServerSnapshot)
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-[calc(var(--radius-md)-2px)] text-muted-foreground transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active && "bg-card text-foreground shadow-sm"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { ThemeToggle }
