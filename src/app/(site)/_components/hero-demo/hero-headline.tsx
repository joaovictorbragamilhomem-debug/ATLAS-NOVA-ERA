"use client"

import { useHeroDemoContext } from "./hero-demo-context"

const PHRASES = ["Registre a venda.", "Cobre pelo WhatsApp.", "Receba com Pix."] as const

// "Marca-texto" crescendo da esquerda pra direita atrás da frase ativa — o
// crescimento de background-size não dá pra fazer só com utilities do
// Tailwind, por isso o <style> escopado.
function HeroHeadline() {
  const { phase } = useHeroDemoContext()

  return (
    <h1 className="flex flex-col gap-1 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
      <style>{`
        .hero-phrase {
          width: fit-content;
          padding-block: 0.05em;
          color: var(--muted-foreground);
          background-image: linear-gradient(var(--accent), var(--accent));
          background-repeat: no-repeat;
          background-position: 0 86%;
          background-size: 0% 0.32em;
          transition: color 0.5s ease, background-size 0.55s cubic-bezier(0.2, 0.7, 0.3, 1);
        }
        .hero-phrase[data-active="true"] {
          color: var(--foreground);
          background-size: 100% 0.32em;
        }
      `}</style>
      {PHRASES.map((phrase, index) => (
        <span key={phrase} data-active={phase === index} className="hero-phrase">
          {phrase}
        </span>
      ))}
    </h1>
  )
}

export { HeroHeadline }
