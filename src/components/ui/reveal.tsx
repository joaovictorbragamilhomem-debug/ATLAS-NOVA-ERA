"use client"

import * as React from "react"
import { motion } from "motion/react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

// O hook useReducedMotion() da lib "motion" lê matchMedia já na primeira
// renderização do cliente, que não bate com o servidor (sempre "não
// reduzido", por não ter matchMedia). Isso não é só um aviso de hidratação:
// como o servidor manda o HTML com opacity:0 (estado inicial da animação) e
// o React não corrige atributos divergentes depois de um mismatch, quem tem
// reduced-motion ativado no SO ficava com a seção inteira invisível para
// sempre. useSyncExternalStore resolve isso do jeito que o React recomenda:
// usa getServerSnapshot (false) na hidratação e só troca pro valor real
// depois, num re-render normal (mesma técnica de hero-demo/use-hero-demo.ts).
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
  const reduceMotion = useReducedMotionSafe()

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
