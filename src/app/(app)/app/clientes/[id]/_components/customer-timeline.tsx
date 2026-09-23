import { Undo2Icon } from "lucide-react"
import { cn } from "cn"
import { formatCentsToBRL } from "@/lib/masks"
import { PAYMENT_METHOD_LABEL } from "../../../_components/register-payment-dialog"
import type { TimelineEvent } from "@/lib/customers/get-customer-timeline"

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  if (event.type === "payment") {
    return (
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full",
            event.reversed ? "bg-muted-foreground" : "bg-primary"
          )}
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className={cn("text-sm", event.reversed && "text-muted-foreground line-through")}>
            {event.reversed && <Undo2Icon className="mr-1 inline size-3.5 align-text-bottom" aria-hidden="true" />}
            Pagamento de {formatCentsToBRL(event.amountCents)} · {PAYMENT_METHOD_LABEL[event.method]} · parcela{" "}
            {event.installmentNumber}
          </p>
          {event.reversed && event.reversedReason && (
            <p className="text-xs text-muted-foreground">Estornado: {event.reversedReason}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn("mt-1 size-2 shrink-0 rounded-full", event.direction === "outbound" ? "bg-accent-foreground/40" : "bg-muted-foreground")}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm">
          <span className="text-muted-foreground">{event.direction === "outbound" ? "Você: " : "Cliente: "}</span>
          {event.body}
        </p>
        <p className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p>
      </div>
    </div>
  )
}

function CustomerTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pagamento ou mensagem ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={`${event.type}-${event.id}`}>
          <TimelineRow event={event} />
        </li>
      ))}
    </ul>
  )
}

export { CustomerTimeline }
