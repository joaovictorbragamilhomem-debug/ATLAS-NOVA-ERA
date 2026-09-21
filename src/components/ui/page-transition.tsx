"use client"

import * as React from "react"
import { motion } from "motion/react"
import { useEntranceAnimationEnabled } from "@/lib/motion-hooks"

// Transição entre telas do painel: um fade curto, só de opacidade (sem
// transform, pra não criar um containing block para elementos "fixed" dentro
// da página). Sempre renderiza o mesmo <motion.div> e só liga/desliga a
// animação por props — trocar o elemento conforme o estado remontaria a tela
// inteira (e perderia o que a pessoa digitou num formulário) quando o valor
// de reduced-motion mudar logo após a hidratação.
function PageTransition({ children }: { children: React.ReactNode }) {
  const enabled = useEntranceAnimationEnabled()

  return (
    <motion.div
      initial={enabled ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export { PageTransition }
