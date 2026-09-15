import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getCustomerWithContracts } from "@/lib/customers/get-customer-with-contracts"
import { getConversationThread, getLastInboundAt } from "@/lib/whatsapp/get-conversation-thread"
import { isWithinReplyWindow } from "@/lib/whatsapp/reply-window"
import { getOpenInstallmentsForCustomer } from "@/lib/installments/get-open-installments-for-customer"
import { ThreadPanel } from "./_components/thread-panel"
import { ReplyComposer } from "./_components/reply-composer"
import { CustomerContextPanel } from "./_components/customer-context-panel"
import { AutoRefresh } from "../_components/auto-refresh"

export default async function ConversaDetalhePage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const [{ customer, contracts }, messages, openInstallments] = await Promise.all([
    getCustomerWithContracts(customerId),
    getConversationThread(membership.organizationId, customerId),
    getOpenInstallmentsForCustomer(customerId),
  ])

  if (!customer) notFound()

  const withinWindow = isWithinReplyWindow(getLastInboundAt(messages))

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
          <ReplyComposer customerId={customerId} withinWindow={withinWindow} openInstallments={openInstallments} />
        </div>

        <CustomerContextPanel customerId={customer.id} customerName={customer.name} contracts={contracts} />
      </div>
    </main>
  )
}
