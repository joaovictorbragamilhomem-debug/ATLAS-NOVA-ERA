"use client"

import { motion, useReducedMotion } from "motion/react"

type RevealProps = {
  children: React.ReactNode
  delay?: number
  y?: number
  x?: number
  className?: string
  once?: boolean
  amount?: number
}

// Irmão do AnimateIn, mas disparado ao entrar na tela (whileInView) em vez
// de na montagem — para seções abaixo da dobra que só devem animar quando
// o usuário rola até elas.
function Reveal({ children, delay = 0, y = 16, x = 0, className, once = true, amount = 0.2 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export { Reveal }
