import Link from "next/link"
import { Button } from "@/components/ui/button"

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="text-2xl font-semibold sm:text-3xl">Pare de correr atrás de cliente</h2>
        <p className="max-w-md text-primary-foreground/85">
          Comece grátis por 7 dias e veja a cobrança acontecer sozinha, no horário certo.
        </p>
        <Button size="lg" variant="secondary" nativeButton={false} render={<Link href="/app" prefetch={false} />}>
          Testar grátis por 7 dias
        </Button>
      </div>
    </section>
  )
}

export { FinalCta }
