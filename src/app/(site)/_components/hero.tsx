import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroPanelMock } from "./hero-panel-mock"

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Cobrança no automático, direto no WhatsApp
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Organize clientes, contratos e parcelas num só lugar — e deixe o WhatsApp lembrar,
          cobrar e confirmar pagamento no horário certo, sozinho.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="/app" prefetch={false} />}>
            Testar grátis por 7 dias
          </Button>
          <Button size="lg" variant="secondary" nativeButton={false} render={<a href="#como-funciona" />}>
            Ver como funciona
          </Button>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Sem cartão de crédito</span>
          <span>Funciona no celular</span>
          <span>Cancele quando quiser</span>
        </div>
      </div>

      <HeroPanelMock />
    </section>
  )
}

export { Hero }
