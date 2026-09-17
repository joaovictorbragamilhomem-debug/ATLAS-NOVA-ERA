import { requireMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site"
import { EmptyState } from "@/components/ui/empty-state"
import { FileTextIcon } from "lucide-react"
import { IntakeSlugForm } from "./_components/intake-slug-form"
import { IntakeFormsList, type IntakeFormRow } from "./_components/intake-forms-list"

export default async function FichasPage() {
  const membership = await requireMembership()

  const supabase = await getSupabaseServerClient()

  const [{ data: organization }, { data: intakeForms }] = await Promise.all([
    supabase.from("organizations").select("intake_slug").eq("id", membership.organizationId).maybeSingle(),
    supabase
      .from("intake_forms")
      .select("id, name, cpf, whatsapp, status, created_at")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const rows: IntakeFormRow[] = (intakeForms ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    cpf: f.cpf,
    whatsapp: f.whatsapp,
    status: f.status,
    createdAt: f.created_at,
  }))

  const pending = rows.filter((r) => r.status === "received" || r.status === "in_review")
  const reviewed = rows.filter((r) => r.status === "approved" || r.status === "rejected")

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Fichas de cadastro</h1>

      <IntakeSlugForm
        currentSlug={organization?.intake_slug ?? null}
        siteUrl={SITE_URL}
        canEdit={membership.role === "owner"}
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Aguardando revisão</h2>
        {pending.length === 0 ? (
          <EmptyState icon={FileTextIcon} title="Nenhuma ficha pendente" />
        ) : (
          <IntakeFormsList rows={pending} showActions />
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Já revisadas</h2>
          <IntakeFormsList rows={reviewed} showActions={false} />
        </div>
      )}
    </main>
  )
}
