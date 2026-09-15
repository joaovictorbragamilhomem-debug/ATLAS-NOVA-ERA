import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimateIn } from "@/components/ui/animate-in"
import { HeroDemoProvider } from "./hero-demo/hero-demo-context"
import { HeroHeadline } from "./hero-demo/hero-headline"
import { HeroDemoPhone } from "./hero-demo/hero-demo-phone"

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_top,var(--color-accent)_0%,transparent_70%)] opacity-70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-[-120px] -z-10 size-[360px] rounded-full bg-primary-vivid/10 blur-3xl"
      />

      <HeroDemoProvider>
        <div className="flex flex-col gap-6">
          <AnimateIn>
            <span className="w-fit rounded-4xl bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              Feito pra quem começou no caderno — não pra banco
            </span>
          </AnimateIn>
          <AnimateIn delay={0.06}>
            <HeroHeadline />
          </AnimateIn>
          <AnimateIn delay={0.12}>
            <p className="max-w-lg text-lg text-muted-foreground">
              Organize clientes, contratos e parcelas num só lugar — e deixe o WhatsApp lembrar,
              cobrar e confirmar pagamento no horário certo, sozinho.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.18}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="w-fit transition-transform duration-150 ease-out hover:-translate-y-0.5">
                <Button size="lg" nativeButton={false} render={<Link href="/app" prefetch={false} />}>
                  Testar grátis por 7 dias
                </Button>
              </div>
              <div className="w-fit transition-transform duration-150 ease-out hover:-translate-y-0.5">
                <Button size="lg" variant="secondary" nativeButton={false} render={<a href="#como-funciona" />}>
                  Ver como funciona
                </Button>
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.24}>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>Sem cartão de crédito</span>
              <span>Funciona no celular</span>
              <span>Cancele quando quiser</span>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn delay={0.15}>
          <HeroDemoPhone />
        </AnimateIn>
      </HeroDemoProvider>
    </section>
  )
}

export { Hero }
