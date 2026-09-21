"use client"

import { AnimatePresence, motion } from "motion/react"
import { cn } from "cn"
import { useReducedMotionSafe } from "@/lib/motion-hooks"

type FormErrorProps = {
  message?: string | null
  className?: string
}

// Mensagem de erro inline de formulário: entra com fade + 4px de
// deslocamento e sai com fade. Sempre renderiza a mesma estrutura
// (AnimatePresence + motion.p) e só desliga o movimento por props para
// quem prefere menos animação. O erro só aparece depois de uma ação da
// pessoa (nunca no HTML que veio do servidor), então não há risco de
// esconder conteúdo durante a hidratação. role="alert" faz leitores de tela
// anunciarem o erro quando ele aparece.
function FormError({ message, className }: FormErrorProps) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          role="alert"
          className={cn("text-sm text-destructive", className)}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

export { FormError }
