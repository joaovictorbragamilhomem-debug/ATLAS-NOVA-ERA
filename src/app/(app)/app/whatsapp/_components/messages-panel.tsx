import Link from "next/link"
import type { MessageQueueRow } from "@/lib/whatsapp/get-message-queue"

const TRIGGER_LABEL: Record<string, string> = {
  reminder_before: "Lembrete antes de vencer",
  due_today: "Vence hoje",
  overdue_after: "Atraso",
  renegotiation_offer: "Oferta de renegociação",
  payment_confirmation: "Confirmação de pagamento",
  contract_created: "Contrato criado",
}

const QUEUE_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendada", className: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", className: "bg-accent text-accent-foreground" },
  delivered: { label: "Entregue", className: "bg-accent text-accent-foreground" },
  read: { label: "Lida", className: "bg-accent text-accent-foreground" },
  failed: { label: "Falhou", className: "bg-[#FEE2E2] text-[#B91C1C]" },
  canceled: { label: "Cancelada", className: "bg-[#F5F5F5] text-[#404040]" },
}

function QueueStatusBadge({ status }: { status: string }) {
  const config = QUEUE_STATUS_BADGE[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span className={`inline-flex w-fit shrink-0 items-center rounded-4xl px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function MessagesPanel({ messages }: { messages: MessageQueueRow[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma mensagem enfileirada ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {messages.map((m) => (
        <li key={m.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{m.customerName}</span>
              <span className="text-xs text-muted-foreground">{TRIGGER_LABEL[m.triggerType] ?? m.triggerType}</span>
            </div>
            <div className="flex items-center gap-2">
              <QueueStatusBadge status={m.status} />
              {m.contractId && (
                <Link href={`/app/contratos/${m.contractId}`} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  ver contrato
                </Link>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(m.scheduledFor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
          <p className="text-sm">{m.renderedBody}</p>
          {m.lastError && (
            <p className="text-xs text-[#B91C1C]">
              Erro: {m.lastError} {m.attempts > 0 && `(tentativa ${m.attempts})`}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

export { MessagesPanel }
