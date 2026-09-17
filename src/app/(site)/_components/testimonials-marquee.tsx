"use client"

import * as React from "react"
import { StarIcon } from "lucide-react"
import { cn } from "cn"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

// Ver o comentário equivalente em ui/reveal.tsx: evita o mismatch de
// hidratação que deixaria a faixa animando com o valor errado até o
// primeiro re-render.
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

type Testimonial = {
  quote: string
  name: string
  source: string
  date: string
  rating: 1 | 2 | 3 | 4 | 5
}

// Vazio de propósito: preencha só com depoimentos reais (nome e fonte
// verificáveis, com autorização de quem falou) antes de usar esta seção.
// Nunca com avaliações inventadas — isso seria propaganda enganosa. Com a
// lista vazia, TestimonialsMarquee não renderiza nada.
const TESTIMONIALS: Testimonial[] = []

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn("size-3.5", i < rating ? "fill-warning text-warning" : "text-border")}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <StarRating rating={testimonial.rating} />
      <p className="text-sm text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-auto flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {testimonial.name[0]}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold">{testimonial.name}</span>
          <span className="text-[0.65rem] text-muted-foreground">
            {testimonial.source} · {testimonial.date}
          </span>
        </div>
      </div>
    </div>
  )
}

// Faixa horizontal contínua (CSS puro, sem lib de animação): a lista some
// duplicada lado a lado e o loop reinicia exatamente na metade, então a
// emenda fica invisível. Pausa no hover pra dar tempo de ler.
function MarqueeStyles() {
  return (
    <style>{`
      @keyframes testimonials-marquee-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      .testimonials-marquee-track {
        animation: testimonials-marquee-scroll 40s linear infinite;
      }
      .testimonials-marquee-track:hover {
        animation-play-state: paused;
      }
    `}</style>
  )
}

// Seção pronta pra uso, mas deliberadamente fora de page.tsx até existirem
// depoimentos reais de clientes do Atlas — ver o comentário em TESTIMONIALS.
function TestimonialsMarquee({ testimonials = TESTIMONIALS }: { testimonials?: Testimonial[] }) {
  const reducedMotion = useReducedMotionSafe()

  if (testimonials.length === 0) return null

  const track = reducedMotion ? testimonials : [...testimonials, ...testimonials]

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <MarqueeStyles />
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">O que quem usa o Atlas diz</h2>
      </div>

      <div className={cn("flex gap-4", reducedMotion ? "overflow-x-auto pb-2" : "overflow-hidden")}>
        <div className={cn("flex gap-4", !reducedMotion && "testimonials-marquee-track w-max")}>
          {track.map((testimonial, index) => (
            <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}

export { TestimonialsMarquee, type Testimonial }
