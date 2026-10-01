"use client"

import { motion } from "motion/react"
import { cn } from "cn"
import { useReducedMotionSafe } from "@/lib/motion-hooks"

// A hairline that is "drawn" left to right when it scrolls into view — used
// to connect the steps of a sequence. Static with reduced motion.
function DrawLine({ className, delay = 0.1 }: { className?: string; delay?: number }) {
  const reduceMotion = useReducedMotionSafe()

  if (reduceMotion) {
    return <div aria-hidden className={cn("h-px origin-left bg-primary/50", className)} />
  }

  return (
    <motion.div
      aria-hidden
      className={cn("h-px origin-left bg-primary/50", className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

export { DrawLine }
