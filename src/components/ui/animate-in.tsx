"use client"

import * as React from "react"
import { motion } from "motion/react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

// Ver o comentário equivalente em ui/reveal.tsx: o hook useReducedMotion()
// da lib "motion" causa mismatch de hidratação que deixa o conteúdo
// invisível para sempre em quem tem reduced-motion ativado no SO.
function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
function getReducedMotionServerSnapshot() {
  return false
}
function useReducedMotionSafe(): boolean {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
}

type AnimateInProps = {
  children: React.ReactNode
  delay?: number
  className?: string
}

// Entrada leve e curta (150–250ms, ease-out), desligada para quem prefere
// menos movimento no sistema operacional.
function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  const reduceMotion = useReducedMotionSafe()

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
