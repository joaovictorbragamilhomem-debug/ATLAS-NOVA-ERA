"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, MessageCircleIcon } from "lucide-react"
import { cn } from "cn"
import { formatCentsToBRL } from "@/lib/masks"
import { useHeroDemoContext } from "./hero-demo-context"
import { TransactionRow } from "./transaction-row"
import { BalanceDisplay } from "./balance-display"
import { WhatsappOverlay } from "./whatsapp-overlay"
import { HeroStepper } from "./hero-stepper"
import { DEMO_AMOUNT_CENTS, DEMO_CUSTOMER_INITIALS, DEMO_CUSTOMER_NAME } from "./demo-data"

// Flutuação ambiente muito discreta (±3px) no celular — a prioridade é a
// animação da interface por dentro, isso aqui é só um respiro de fundo.
// `background-size` da marca-texto do headline vive em hero-headline.tsx;
// aqui só o keyframe do float, que o Tailwind não expressa como utility.
function HeroPhoneStyles() {
  return (
    <style>{`
      @keyframes hero-phone-float {
        0%, 100% { transform: translateY(-3px); }
        50% { transform: translateY(3px); }
      }
      .hero-phone-float { animation: hero-phone-float 6s ease-in-out infinite; }
    `}</style>
  )
}

// Mockup animado que mostra o produto "funcionando": venda fiado entra,
// lembrete sai pelo WhatsApp com o Pix, pagamento chega e o saldo zera.
// Decorativo — o texto do Hero já carrega a informação essencial — por
// isso fica fora da árvore de acessibilidade.
function HeroDemoPhone() {
  const { phase, isResetting, isBtnDown, isWaOpen, isWaSent, onPointerEnter, onPointerLeave } =
    useHeroDemoContext()

  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
      <HeroPhoneStyles />

      <div
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        data-phase={phase}
        data-resetting={isResetting}
        data-btn-down={isBtnDown}
        data-wa-open={isWaOpen}
        data-wa-sent={isWaSent}
        className="hero-phone-float relative w-full rounded-[2.5rem] border-[6px] border-card-foreground bg-card-foreground p-2 shadow-lg"
      >
        <div className="relative flex h-[540px] flex-col overflow-hidden rounded-[2rem] bg-card">
          <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[0.65rem] font-medium text-card-foreground">
            <span>9:41</span>
            <span className="text-[0.6rem] text-muted-foreground">Atlas</span>
          </div>

          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {DEMO_CUSTOMER_INITIALS}
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-xs font-semibold">{DEMO_CUSTOMER_NAME}</span>
              <span className="text-[0.65rem] text-muted-foreground">Fiado em aberto</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 px-3 py-3">
            <TransactionRow
              icon={ArrowUpRightIcon}
              label="Venda no fiado"
              meta="Hoje, 10:42"
              amount={formatCentsToBRL(DEMO_AMOUNT_CENTS)}
              tone="debit"
              active={!isResetting}
            />
            <TransactionRow
              icon={ArrowDownLeftIcon}
              label="Pagamento via Pix"
              meta="Hoje, 11:15"
              amount={formatCentsToBRL(DEMO_AMOUNT_CENTS)}
              tone="credit"
              active={phase === 2}
              delayMs={300}
            />

            <div className="mt-auto flex flex-col gap-2">
              <BalanceDisplay settled={phase === 2} />
              <button
                type="button"
                tabIndex={-1}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-transform duration-200 ease-out",
                  isBtnDown && "scale-[0.92] shadow-[0_0_0_5px_rgba(4,120,87,0.18)]"
                )}
              >
                <MessageCircleIcon className="size-3.5" aria-hidden="true" />
                Enviar lembrete
              </button>
            </div>
          </div>

          <WhatsappOverlay open={isWaOpen} sent={isWaSent} />
        </div>
      </div>

      <HeroStepper phase={phase} />
    </div>
  )
}

export { HeroDemoPhone }
