import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import { GlobeStatic } from "@/components/marketing/globe/globe-static"

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <Reveal className="relative isolate overflow-hidden rounded-3xl border border-primary/25 bg-(--ink) px-6 py-16 text-(--ink-foreground) sm:px-12 lg:py-20">
        {/* The hero globe again, drawn quietly, closing the page where it opened.
            Forced to the dark-theme colors because the panel is always ink. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-40 -z-10 w-[520px] opacity-60 max-sm:opacity-35 [--globe-line:#f6f1e8] [--globe-route:#2dd4a8] max-sm:-right-48 max-sm:-bottom-56 sm:w-[600px]"
        >
          <GlobeStatic className="size-full" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 -z-10 size-80 rounded-full bg-primary/15 blur-[100px]"
        />

        <div className="flex max-w-lg flex-col items-start gap-5">
          <h2 className="font-display text-3xl font-semibold text-balance sm:text-[2.75rem] sm:leading-[1.08]">
            Pare de correr atrás de cliente
          </h2>
          <p className="text-(--ink-foreground)/75 sm:text-lg">
            Comece grátis por 7 dias e veja a cobrança acontecer sozinha, no horário certo.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/app" prefetch={false} />}
            className="mt-2 transition-transform duration-200 hover:-translate-y-0.5"
          >
            Testar grátis por 7 dias
          </Button>
        </div>
      </Reveal>
    </section>
  )
}

export { FinalCta }
