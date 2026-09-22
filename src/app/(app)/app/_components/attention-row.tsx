import Link from "next/link"
import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterPaymentDialog } from "./register-payment-dialog"
import { formatCentsToBRL } from "@/lib/masks"

type AttentionRowProps = {
  contractId: string
  customerId: string
  customerName: string
  installmentId: string
  installmentNumber: number
  remainingCents: number
  subtitle: React.ReactNode
}

// Linha usada nas duas listas do dashboard (próximos vencimentos e maiores
// atrasos) — dá pra agir (dar baixa, mandar lembrete) sem sair da tela.
function AttentionRow({
  contractId,
  customerId,
  customerName,
  installmentId,
  installmentNumber,
  remainingCents,
  subtitle,
}: AttentionRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
      <Link href={`/app/contratos/${contractId}`} className="flex min-w-0 flex-col transition-colors hover:text-foreground">
        <span className="truncate font-medium">{customerName}</span>
        {subtitle}
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-medium tabular-nums">{formatCentsToBRL(remainingCents)}</span>
        <RegisterPaymentDialog
          installmentId={installmentId}
          installmentNumber={installmentNumber}
          suggestedAmountCents={remainingCents}
          triggerVariant="secondary"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          nativeButton={false}
          render={<Link href={`/app/conversas/${customerId}?lembrete=${installmentId}`} />}
        >
          <BellIcon />
          <span className="sr-only">Enviar lembrete</span>
        </Button>
      </div>
    </div>
  )
}

export { AttentionRow }
