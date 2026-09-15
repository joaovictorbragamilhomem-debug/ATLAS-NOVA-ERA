"use client"

import * as React from "react"
import { useHeroDemo, type HeroDemoApi } from "./use-hero-demo"

const HeroDemoContext = React.createContext<HeroDemoApi | null>(null)

// Uma única instância da timeline, compartilhada entre o headline (coluna
// da esquerda) e o mockup do celular (coluna da direita) — os dois ficam
// sincronizados na mesma fase sem precisar levantar estado manualmente.
function HeroDemoProvider({ children }: { children: React.ReactNode }) {
  const api = useHeroDemo()
  return <HeroDemoContext.Provider value={api}>{children}</HeroDemoContext.Provider>
}

function useHeroDemoContext(): HeroDemoApi {
  const context = React.useContext(HeroDemoContext)
  if (!context) {
    throw new Error("useHeroDemoContext must be used within a HeroDemoProvider")
  }
  return context
}

export { HeroDemoProvider, useHeroDemoContext }
