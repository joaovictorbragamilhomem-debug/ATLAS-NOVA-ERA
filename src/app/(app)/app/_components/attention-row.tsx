import Link from "next/link"
import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterPaymentDialog } from "./register-payment-dialog"
import { WhatsAppChargeDialog } from "./whatsapp-charge-dialog"
import { formatCentsToBRL } from "@/lib/masks"
import type { ChargeLinks } from "@/lib/whatsapp/get-charge-links"

type AttentionRowProps = {
  contractId: string
  customerId: string
  customerName: string
  installmentId: string
  installmentNumber: number
  remainingCents: number
  chargeLinks?: ChargeLinks
  subtitle: React.ReactNode
}

// Linha usada nas duas listas do dashboard (próximos vencimentos e maiores
// atrasos) — dá pra agir (registrar pagamento, cobrar) sem sair da tela.
// Every action has a visible text label: icon-only buttons are a guessing
// game for people who don't use apps every day.
function AttentionRow({
  contractId,
  customerId,
  customerName,
  installmentId,
  installmentNumber,
  remainingCents,
  chargeLinks,
  subtitle,
}: AttentionRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/app/contratos/${contractId}`} className="flex min-w-0 flex-col transition-colors hover:text-foreground">
          <span className="truncate font-medium underline-offset-4 hover:underline">{customerName}</span>
          {subtitle}
        </Link>
        <span className="shrink-0 text-base font-semibold tabular-nums">{formatCentsToBRL(remainingCents)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RegisterPaymentDialog
          installmentId={installmentId}
          installmentNumber={installmentNumber}
          suggestedAmountCents={remainingCents}
          customerName={customerName}
          triggerVariant="secondary"
        />
        {chargeLinks && <WhatsAppChargeDialog links={chargeLinks} />}
        <Button
          size="sm"
          variant="ghost"
          nativeButton={false}
          render={<Link href={`/app/conversas/${customerId}?lembrete=${installmentId}`} />}
        >
          <BellIcon aria-hidden="true" /> Lembrete
        </Button>
      </div>
    </div>
  )
}

export { AttentionRow }
