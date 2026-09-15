import { CheckCheckIcon } from "lucide-react"
import { cn } from "cn"
import { formatCentsToBRL } from "@/lib/masks"
import { DEMO_AMOUNT_CENTS, DEMO_CUSTOMER_FIRST_NAME, DEMO_CUSTOMER_INITIALS, DEMO_CUSTOMER_NAME } from "./demo-data"

// Painel que sobe por cima da tela do app simulando o envio automático pelo
// WhatsApp: mensagem com o Pix copia-e-cola (texto, igual ao produto real —
// o app nunca gera QR) e a confirmação de envio, que chega com atraso.
function WhatsappOverlay({ open, sent }: { open: boolean; sent: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col bg-[#0b1210] transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(0.3,1.15,0.4,1)]",
        open ? "translate-y-0 opacity-100" : "translate-y-[103%] opacity-60"
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-vivid/20 text-[0.6rem] font-semibold text-primary-vivid">
          {DEMO_CUSTOMER_INITIALS}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white">{DEMO_CUSTOMER_NAME}</span>
          <span className="text-[0.6rem] text-white/50">WhatsApp</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-1.5 px-3 py-3">
        <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-sm bg-primary px-3 py-2">
          <p className="text-[0.7rem] leading-snug text-primary-foreground">
            Oi {DEMO_CUSTOMER_FIRST_NAME}! Sua parcela de {formatCentsToBRL(DEMO_AMOUNT_CENTS)} venceu. Segue o Pix
            pra regularizar:
          </p>
          <p className="mt-1.5 truncate rounded-md bg-black/15 px-2 py-1.5 font-mono text-[0.6rem] text-primary-foreground/80">
            00020126580014BR.GOV.BCB.PIX...5802BR6009…
          </p>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[0.6rem] text-primary-foreground/70">9:41</span>
            <CheckCheckIcon className="size-3 text-primary-foreground/70" aria-hidden="true" />
          </div>
        </div>

        <p
          className={cn(
            "ml-auto flex items-center gap-1 pr-1 text-[0.65rem] font-medium text-white/70 transition-opacity duration-[350ms]",
            sent ? "opacity-100" : "opacity-0"
          )}
        >
          Mensagem enviada
          <CheckCheckIcon className="size-3 text-primary-vivid" aria-hidden="true" />
        </p>
      </div>
    </div>
  )
}

export { WhatsappOverlay }
