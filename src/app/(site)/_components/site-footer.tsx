import Link from "next/link"
import Image from "next/image"

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background-secondary/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div className="flex flex-col gap-2">
            <span className="font-display flex items-center gap-2.5 text-[0.95rem] font-semibold tracking-[0.08em]">
              <Image src="/icon-192.png" alt="" width={28} height={28} className="rounded-md ring-1 ring-border" />
              <span>
                ATLAS <span className="font-medium text-muted-foreground">NOVA ERA</span>
              </span>
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              Gestão de crediário, fiado e parcelas, com cobrança pelo WhatsApp. Não somos banco
              nem financeira: não guardamos e não movimentamos dinheiro de ninguém.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Link href="/termos" className="text-muted-foreground hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground">
              Política de Privacidade
            </Link>
            <a
              href="mailto:contato@atlasnovaera.com.br"
              className="text-muted-foreground hover:text-foreground"
            >
              contato@atlasnovaera.com.br
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>CNPJ 40.948.203/0001-29 · Lucas Vinicius da Luz Villacorta</span>
          <span>© {new Date().getFullYear()} ATLAS NOVA ERA. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }
