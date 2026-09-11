import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export type TeamMember = {
  id: string
  role: "owner" | "manager" | "operator"
  status: "invited" | "active" | "removed"
  email: string
  createdAt: string
}

// auth.users não é uma tabela que dá para ler pela RLS normal — por isso
// usa o cliente admin só para buscar o e-mail de cada membro, depois de já
// ter confirmado (com o cliente normal) que quem pediu pode ver a equipe.
export async function getTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const supabase = await getSupabaseServerClient()
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, role, status, invited_email, user_id, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })

  if (!memberships) return []

  const admin = getSupabaseAdminClient()

  const result: TeamMember[] = []
  for (const m of memberships) {
    let email = m.invited_email ?? ""
    if (m.user_id && admin) {
      const { data } = await admin.auth.admin.getUserById(m.user_id)
      if (data.user?.email) email = data.user.email
    }
    result.push({ id: m.id, role: m.role, status: m.status, email, createdAt: m.created_at })
  }
  return result
}
