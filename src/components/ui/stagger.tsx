"use client"

import * as React from "react"
import { motion, type Variants } from "motion/react"
import { useEntranceAnimationEnabled } from "@/lib/motion-hooks"

const containerVariants: Variants = { hidden: {}, show: {} }

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

const MOTION_TAGS = { div: motion.div, ul: motion.ul, li: motion.li } as const

type StaggerProps = {
  children: React.ReactNode
  className?: string
  as?: "div" | "ul"
  /** Atraso antes do primeiro filho começar (segundos). */
  delay?: number
  /** Intervalo entre um filho e o próximo (segundos). */
  step?: number
}

// Entrada em cascata (opacidade + 8px de deslocamento) para grupos de cards
// e listas. Só anima quando o grupo aparece por navegação — na primeira
// carga da página o conteúdo já vem visível do servidor e não é escondido
// esperando o JS (ver useEntranceAnimationEnabled).
function Stagger({ children, className, as = "div", delay = 0, step = 0.05 }: StaggerProps) {
  const enabled = useEntranceAnimationEnabled()
  const Tag = MOTION_TAGS[as] as typeof motion.div

  return (
    <Tag
      className={className}
      variants={containerVariants}
      initial={enabled ? "hidden" : false}
      animate="show"
      transition={{ staggerChildren: step, delayChildren: delay }}
    >
      {children}
    </Tag>
  )
}

type StaggerItemProps = {
  children: React.ReactNode
  className?: string
  as?: "div" | "li"
}

function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const Tag = MOTION_TAGS[as] as typeof motion.div

  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  )
}

export { Stagger, StaggerItem }
