import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PencilIcon } from "lucide-react"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { formatCPF, formatPhoneBR, e164BRToDigits } from "@/lib/masks"

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const supabase = await getSupabaseServerClient()
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle()

  if (!customer) notFound()

  const address = [customer.address_street, customer.address_number, customer.address_district, customer.address_city, customer.address_state]
    .filter(Boolean)
    .join(", ")

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{formatCPF(customer.cpf)}</p>
        </div>
        <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={`/app/clientes/${id}/editar`} />}>
          <PencilIcon /> Editar
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">WhatsApp</span>
          <span>{formatPhoneBR(e164BRToDigits(customer.whatsapp))}</span>
        </div>
        {customer.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span>{customer.email}</span>
          </div>
        )}
        {address && (
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Endereço</span>
            <span className="text-right">{address}</span>
          </div>
        )}
        {customer.tags?.length > 0 && (
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Tags</span>
            <span className="text-right">{customer.tags.join(", ")}</span>
          </div>
        )}
        {customer.notes && (
          <div className="flex flex-col gap-1 border-t border-border pt-2">
            <span className="text-muted-foreground">Observações</span>
            <span>{customer.notes}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Contratos</h2>
        <div className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
          Nenhum contrato ainda.
        </div>
      </div>
    </main>
  )
}
