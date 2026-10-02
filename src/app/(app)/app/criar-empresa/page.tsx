import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { CreateOrganizationForm } from "./_components/create-organization-form"

// Where requireMembership() sends a signed-in person who was never linked to
// any company, so they can finish the setup on their own.
export default async function CriarEmpresaPage() {
  if (await getCurrentMembership()) redirect("/app")

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/app/entrar")

  const admin = getSupabaseAdminClient()
  const { data: rows } = admin
    ? await admin.from("memberships").select("id").eq("user_id", user.id).limit(1)
    : { data: null }
  if (rows && rows.length > 0) redirect("/app")

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Falta só o nome da sua empresa</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta ({user.email}) está pronta, mas ainda não está ligada a nenhuma empresa. Informe o
          nome da sua loja para começar o teste grátis de 7 dias.
        </p>
      </div>
      <CreateOrganizationForm defaultFullName={fullName} />
    </main>
  )
}
