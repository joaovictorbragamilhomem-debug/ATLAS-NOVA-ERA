import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatPhoneBR } from "@/lib/masks"
import { suggestWhatsappDigits, type UnknownConversationRow } from "@/lib/whatsapp/unknown-conversations"

function UnknownNumberList({ conversations }: { conversations: UnknownConversationRow[] }) {
  if (conversations.length === 0) return null

  return (
    <section aria-labelledby="unknown-title" className="flex flex-col gap-2">
      <div>
        <h2 id="unknown-title" className="text-lg font-semibold">
          Números desconhecidos
        </h2>
        <p className="text-sm text-muted-foreground">
          Estes números ainda não são clientes. Cadastre para acompanhar a conversa e responder.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {conversations.map((c) => {
          const suggested = suggestWhatsappDigits(c.phoneDigits)
          return (
            <li
              key={c.phoneDigits}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{formatPhoneBR(suggested)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.lastMessageAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    {c.messageCount > 1 ? ` · ${c.messageCount} mensagens` : ""}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.lastMessageBody}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                nativeButton={false}
                className="shrink-0"
                render={<Link href={`/app/clientes/novo?whatsapp=${suggested}`} />}
              >
                Cadastrar como cliente
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export { UnknownNumberList }
