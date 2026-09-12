import { notFound } from "next/navigation"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { submitIntakeFormAction, type IntakeFormActionState } from "@/lib/intake/actions"
import { IntakeForm } from "./_components/intake-form"

export default async function FichaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const admin = getSupabaseAdminClient()
  const { data: organization } = admin
    ? await admin.from("organizations").select("id, name").eq("intake_slug", slug).maybeSingle()
    : { data: null }

  if (!organization) notFound()

  const boundAction = submitIntakeFormAction.bind(null, slug) as (
    state: IntakeFormActionState,
    formData: FormData
  ) => Promise<IntakeFormActionState>

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{organization.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados para se cadastrar.</p>
      </div>
      <IntakeForm action={boundAction} />
    </main>
  )
}
