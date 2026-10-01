import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimateIn } from "@/components/ui/animate-in"
import { HeroGlobe } from "@/components/marketing/globe/hero-globe"
import { HeroDemoProvider } from "./hero-demo/hero-demo-context"
import { HeroHeadline } from "./hero-demo/hero-headline"
import { HeroDemoPhone } from "./hero-demo/hero-demo-phone"

const TRUST_POINTS = ["Sem cartão de crédito", "Funciona no celular", "Cancele quando quiser"]

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Drafting paper: fine grid + a soft brand glow behind the globe. */}
      <div aria-hidden className="drafting-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[18%] right-[-8%] -z-10 size-[520px] rounded-full bg-primary/[0.07] blur-[110px] max-lg:top-[50%] max-lg:right-[-40%]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-8 lg:pt-20 lg:pb-16">
        <HeroDemoProvider>
          <div className="relative z-10 flex flex-col gap-7">
            <AnimateIn>
              <span className="inline-flex w-fit items-center gap-2 rounded-4xl border border-primary/25 bg-background/70 px-3 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                Do caderno pro WhatsApp, sem complicação
              </span>
            </AnimateIn>
            <AnimateIn delay={0.06}>
              <HeroHeadline />
            </AnimateIn>
            <AnimateIn delay={0.12}>
              <p className="max-w-md text-lg text-pretty text-muted-foreground">
                Organize o crediário e o fiado num só lugar — veja quem vence hoje e mande a cobrança
                pronta no WhatsApp, educada, com o valor certo e o Pix.
              </p>
            </AnimateIn>

            <AnimateIn delay={0.18}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/app" prefetch={false} />}
                  className="shadow-[0_8px_24px_-8px_color-mix(in_oklch,var(--primary),transparent_40%)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
                >
                  Testar grátis por 7 dias
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<a href="#como-funciona" />}
                  className="bg-background/60 backdrop-blur"
                >
                  Ver como funciona
                </Button>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.24}>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {TRUST_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <CheckIcon className="size-3.5 text-primary" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </AnimateIn>
          </div>

          {/* Stage: the Atlas globe behind the live product demo. */}
          <div className="relative flex justify-center lg:justify-start lg:pl-4">
            <HeroGlobe className="absolute top-[40%] left-[62%] -z-10 w-[min(150%,680px)] -translate-x-1/2 -translate-y-1/2 sm:left-1/2 sm:top-[46%] sm:w-[min(120%,680px)] lg:left-[70%] lg:w-[640px]" />
            <AnimateIn delay={0.15} className="relative w-full max-w-[300px]">
              <HeroDemoPhone />
            </AnimateIn>
          </div>
        </HeroDemoProvider>
      </div>
    </section>
  )
}

export { Hero }
