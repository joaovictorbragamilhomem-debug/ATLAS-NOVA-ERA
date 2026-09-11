"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { SITE_URL } from "@/lib/site"

export type TeamActionState = { error: string | null }

const ROLES = ["owner", "manager", "operator"] as const
type Role = (typeof ROLES)[number]

export async function inviteTeamMemberAction(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const role = String(formData.get("role") ?? "") as Role

  if (!email || !ROLES.includes(role)) {
    return { error: "Preencha o e-mail e escolha um papel." }
  }

  const membership = await getCurrentMembership()
  if (!membership || (membership.role !== "owner" && membership.role !== "manager")) {
    return { error: "Só o Dono ou o Gestor podem convidar." }
  }
  if (role === "owner" && membership.role !== "owner") {
    return { error: "Só o Dono pode convidar outro Dono." }
  }

  const supabase = await getSupabaseServerClient()
  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("id")
    .eq("organization_id", membership.organizationId)
    .eq("invited_email", email)
    .maybeSingle()
  if (existingMembership) {
    return { error: "Essa pessoa já foi convidada." }
  }

  // Só o admin pode criar o usuário do convite (auth.users) — mas o
  // vínculo em si é gravado com o cliente normal, como a própria pessoa
  // que convidou, para respeitar as mesmas regras de segurança de sempre.
  const admin = getSupabaseAdminClient()
  if (!admin) return { error: "Supabase não está configurado no servidor." }

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/api/auth/confirm?next=/app/redefinir-senha`,
  })

  if (error || !invited.user) {
    if (error?.message.toLowerCase().includes("already been registered")) {
      return { error: "Já existe uma conta com esse e-mail." }
    }
    return { error: "Não foi possível enviar o convite. Tente novamente." }
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    organization_id: membership.organizationId,
    user_id: invited.user.id,
    role,
    status: "invited",
    invited_email: email,
    invited_by: membership.userId,
  })

  if (membershipError) {
    return { error: "Convite enviado, mas houve um erro ao registrar o vínculo: " + membershipError.message }
  }

  revalidatePath("/app/equipe")
  return { error: null }
}

export async function removeTeamMemberAction(membershipId: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "owner") {
    return { error: "Só o Dono pode remover alguém da equipe." }
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId)

  if (error) return { error: error.message }

  revalidatePath("/app/equipe")
  return { error: null }
}

export async function changeTeamMemberRoleAction(membershipId: string, role: Role): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership()
  if (!membership || (membership.role !== "owner" && membership.role !== "manager")) {
    return { error: "Só o Dono ou o Gestor podem trocar papéis." }
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from("memberships").update({ role }).eq("id", membershipId)

  if (error) return { error: error.message }

  revalidatePath("/app/equipe")
  return { error: null }
}
