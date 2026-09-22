import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { requireMembership } from "@/lib/auth/current-user"
import { getCustomerWithContracts } from "@/lib/customers/get-customer-with-contracts"
import { getConversationThread, getLastInboundAt } from "@/lib/whatsapp/get-conversation-thread"
import { isWithinReplyWindow } from "@/lib/whatsapp/reply-window"
import { getOpenInstallmentsForCustomer } from "@/lib/installments/get-open-installments-for-customer"
import { generatePixMessageAction } from "@/lib/whatsapp/reply-actions"
import { ThreadPanel } from "./_components/thread-panel"
import { ReplyComposer } from "./_components/reply-composer"
import { CustomerContextPanel } from "./_components/customer-context-panel"
import { AutoRefresh } from "../_components/auto-refresh"

export default async function ConversaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>
  searchParams: Promise<{ lembrete?: string }>
}) {
  const { customerId } = await params
  const { lembrete } = await searchParams
  const membership = await requireMembership()

  const [{ customer, contracts }, messages, openInstallments] = await Promise.all([
    getCustomerWithContracts(customerId),
    getConversationThread(membership.organizationId, customerId),
    getOpenInstallmentsForCustomer(customerId),
  ])

  if (!customer) notFound()

  const withinWindow = isWithinReplyWindow(getLastInboundAt(messages))

  // Vem do botão "Enviar lembrete" na ficha do cliente — pré-preenche o
  // texto com o código Pix já embutido; se der erro (ex.: sem chave Pix
  // configurada), a pessoa só escreve a mensagem na mão, sem bloquear a tela.
  let initialBody: string | undefined
  if (lembrete && withinWindow) {
    const result = await generatePixMessageAction(lembrete)
    if ("body" in result) initialBody = result.body
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <AutoRefresh />
      <Link href="/app/conversas" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Conversas
      </Link>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
            <ThreadPanel messages={messages} />
          </div>
          <ReplyComposer
            customerId={customerId}
            withinWindow={withinWindow}
            openInstallments={openInstallments}
            initialBody={initialBody}
          />
        </div>

        <CustomerContextPanel customerId={customer.id} customerName={customer.name} contracts={contracts} />
      </div>
    </main>
  )
}
