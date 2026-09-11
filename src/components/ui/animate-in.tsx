"use client"

import { motion, useReducedMotion } from "motion/react"

type AnimateInProps = {
  children: React.ReactNode
  delay?: number
  className?: string
}

// Entrada leve e curta (150–250ms, ease-out), desligada para quem prefere
// menos movimento no sistema operacional.
function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export { AnimateIn }
