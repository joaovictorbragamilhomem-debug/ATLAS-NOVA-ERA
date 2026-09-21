import { MessageSquareTextIcon } from "lucide-react"
import { requireMembership } from "@/lib/auth/current-user"
import { getConversations, getUnknownConversations } from "@/lib/whatsapp/get-conversations"
import { linkOrphanMessages } from "@/lib/whatsapp/link-orphan-messages"
import { EmptyState } from "@/components/ui/empty-state"
import { ConversationList } from "./_components/conversation-list"
import { UnknownNumberList } from "./_components/unknown-number-list"
import { AutoRefresh } from "./_components/auto-refresh"

export default async function ConversasPage() {
  const membership = await requireMembership()

  await linkOrphanMessages(membership.organizationId)

  const [conversations, unknownConversations] = await Promise.all([
    getConversations(membership.organizationId),
    getUnknownConversations(membership.organizationId),
  ])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground">Mensagens recebidas pelo WhatsApp, por cliente.</p>
      </div>

      {conversations.length === 0 && unknownConversations.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Nenhuma conversa ainda"
          description="Assim que um cliente mandar mensagem pelo WhatsApp conectado, ela aparece aqui."
        />
      ) : (
        <>
          <UnknownNumberList conversations={unknownConversations} />
          {conversations.length > 0 && <ConversationList conversations={conversations} />}
        </>
      )}
    </main>
  )
}
