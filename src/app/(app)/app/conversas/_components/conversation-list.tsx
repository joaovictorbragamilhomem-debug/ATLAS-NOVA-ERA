import Link from "next/link"
import type { ConversationRow } from "@/lib/whatsapp/get-conversations"

function ConversationList({ conversations }: { conversations: ConversationRow[] }) {
  if (conversations.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((c) => (
        <li key={c.customerId}>
          <Link
            href={`/app/conversas/${c.customerId}`}
            className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                {c.customerName}
                {c.needsAttention && (
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">Precisa de você</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(c.lastMessageAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {c.lastMessageDirection === "outbound" ? (c.lastMessageByAssistant ? "Assistente: " : "Você: ") : ""}
              {c.lastMessageBody}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export { ConversationList }
