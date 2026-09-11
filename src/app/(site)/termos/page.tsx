import type { Metadata } from "next"

export const metadata: Metadata = { title: "Termos de Uso" }

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-[#FEF3C7] bg-[#FEF3C7] px-4 py-3 text-sm text-[#B45309]">
        Rascunho — este texto ainda precisa ser revisado por um advogado antes de valer como termo
        oficial.
      </div>
      <h1 className="text-2xl font-semibold">Termos de Uso</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          O ATLAS NOVA ERA é um sistema de gestão: ajuda quem trabalha com crédito a organizar
          clientes, contratos, parcelas e a comunicação de cobrança pelo WhatsApp. O ATLAS não é
          uma instituição financeira — não empresta, não guarda e não movimenta dinheiro de
          clientes de ninguém.
        </p>
        <p>
          Quem assina o ATLAS é responsável por operar dentro da lei, incluindo o cumprimento dos
          limites legais de juros e encargos aplicáveis ao seu tipo de operação.
        </p>
        <p>TODO: cláusulas completas de uso, responsabilidade, propriedade intelectual, rescisão.</p>
      </div>
    </div>
  )
}
