import type { ThreadMessage } from "@/lib/whatsapp/get-conversation-thread"

function ThreadPanel({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma mensagem nessa conversa ainda.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.direction === "outbound"
              ? "ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-accent px-3 py-2 text-sm text-accent-foreground"
              : "mr-auto max-w-[80%] rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm"
          }
        >
          <p>{m.body}</p>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">
            {new Date(m.occurredAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        </div>
      ))}
    </div>
  )
}

export { ThreadPanel }
