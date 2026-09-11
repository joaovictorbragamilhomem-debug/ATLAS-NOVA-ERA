import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade" }

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-[#FEF3C7] bg-[#FEF3C7] px-4 py-3 text-sm text-[#B45309]">
        Rascunho — este texto ainda precisa ser revisado por um advogado antes de valer como
        política oficial.
      </div>
      <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Nos termos da LGPD, quem assina o ATLAS é o <strong>controlador</strong> dos dados dos
          próprios clientes; o ATLAS atua como <strong>operador</strong> — trata esses dados só
          para prestar o serviço contratado.
        </p>
        <p>
          Cada conta só acessa os próprios dados. Fichas de cadastro preenchidas por clientes
          guardam o aceite do termo (data, hora, IP e versão) no momento do envio.
        </p>
        <p>
          TODO: prazo de retenção após cancelamento, lista completa de dados tratados, direitos do
          titular e canal de contato do encarregado (DPO).
        </p>
      </div>
    </div>
  )
}
