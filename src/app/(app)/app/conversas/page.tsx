import { redirect } from "next/navigation"
import { MessageSquareTextIcon } from "lucide-react"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getConversations } from "@/lib/whatsapp/get-conversations"
import { EmptyState } from "@/components/ui/empty-state"
import { ConversationList } from "./_components/conversation-list"
import { AutoRefresh } from "./_components/auto-refresh"

export default async function ConversasPage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const conversations = await getConversations(membership.organizationId)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground">Mensagens recebidas pelo WhatsApp, por cliente.</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Nenhuma conversa ainda"
          description="Assim que um cliente mandar mensagem pelo WhatsApp conectado, ela aparece aqui."
        />
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </main>
  )
}
