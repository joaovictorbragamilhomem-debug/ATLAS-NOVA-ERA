"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Sem Supabase Realtime por enquanto — só atualiza a tela sozinha de
// tempos em tempos, simples o bastante para o v1 da Central de conversas.
function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}

export { AutoRefresh }
