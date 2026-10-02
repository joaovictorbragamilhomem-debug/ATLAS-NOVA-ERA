"use server"

import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { provisionOrganizationForNewUser } from "@/lib/auth/provision-organization"
import { SITE_URL } from "@/lib/site"
import { sendEmail } from "@/lib/email/resend"
import { welcomeEmail } from "@/lib/email/templates"

export type ActionState = { error: string } | { error: null }

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationName = String(formData.get("organizationName") ?? "").trim()
  const fullName = String(formData.get("fullName") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!organizationName || !fullName || !email || !password) {
    return { error: "Preencha todos os campos." }
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." }
  }

  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE_URL}/api/auth/confirm?next=/app`,
    },
  })

  if (error) {
    console.error("[signUpAction]", error.status, error.message)
    return { error: traduzErroAuth(error.message) }
  }
  if (!data.user) {
    return { error: "Não foi possível criar a conta. Tente novamente." }
  }
  // E-mail já pertence a um usuário confirmado: por segurança (evitar
  // enumeração de e-mails), o Supabase não retorna erro nesse caso — devolve
  // um "usuário" com id que não existe de verdade em auth.users e
  // identities vazio. Sem esse checa, o código seguia e tentava provisionar
  // a organização com esse id fantasma, o que sempre falhava (violação de
  // FK) com uma mensagem genérica que não ajudava ninguém a se recuperar.
  if (data.user.identities?.length === 0) {
    return {
      error: "Este e-mail já tem uma conta. Toque em “Entrar” — se não lembrar a senha, use “Prefiro entrar com um link por e-mail”.",
    }
  }

  const provisioned = await provisionOrganizationForNewUser({
    userId: data.user.id,
    organizationName,
  })
  if ("error" in provisioned) {
    return { error: provisioned.error }
  }

  const { subject, html } = welcomeEmail({ organizationName })
  await sendEmail({ to: email, subject, html })

  redirect("/app/verificar-email")
}

// For a signed-in person with no organization at all (see requireMembership):
// creates their company and trial, the same way sign-up does.
export async function createOrganizationForCurrentUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const organizationName = String(formData.get("organizationName") ?? "").trim()
  const fullName = String(formData.get("fullName") ?? "").trim()
  if (!organizationName || !fullName) return { error: "Preencha todos os campos." }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/app/entrar")

  const admin = getSupabaseAdminClient()
  if (!admin) return { error: "Supabase não está configurado no servidor." }

  // Only for accounts that were never linked to any company — someone removed
  // from a team must not be able to turn that into a new trial here.
  const { data: rows, error: rowsError } = await admin.from("memberships").select("id").eq("user_id", user.id).limit(1)
  if (rowsError) return { error: "Não foi possível concluir agora. Tente novamente em instantes." }
  if ((rows ?? []).length > 0) redirect("/app")

  const provisioned = await provisionOrganizationForNewUser({ userId: user.id, organizationName })
  if ("error" in provisioned) return { error: provisioned.error }

  if (!user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: fullName } })
  }

  if (user.email) {
    const { subject, html } = welcomeEmail({ organizationName })
    await sendEmail({ to: user.email, subject, html })
  }

  redirect("/app")
}

export async function signInWithPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "/app")

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." }
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: traduzErroAuth(error.message) }
  }

  redirect(next.startsWith("/") ? next : "/app")
}

export async function signInWithMagicLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) return { error: "Informe seu e-mail." }

  const supabase = await getSupabaseServerClient()
  // shouldCreateUser: false — the e-mail link is only a way to sign in. By
  // default Supabase creates a brand-new auth user for an unknown e-mail,
  // which left people with an account but no organization: they then saw
  // "sua conta não está vinculada a nenhuma empresa" and could no longer
  // sign up ("já existe uma conta"). Accounts are only created by sign-up.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/api/auth/confirm?next=/app` },
  })

  if (error) return { error: traduzErroAuth(error.message) }
  return { error: null }
}

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) return { error: "Informe seu e-mail." }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/api/auth/confirm?next=/app/redefinir-senha`,
  })

  if (error) return { error: traduzErroAuth(error.message) }
  return { error: null }
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "")
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." }
  }

  const supabase = await getSupabaseServerClient()
  const { data: userData, error } = await supabase.auth.updateUser({ password })

  if (error) return { error: traduzErroAuth(error.message) }

  // Se essa senha veio de um convite de equipe, o vínculo estava
  // "invited" até a pessoa aceitar de fato — agora ela acabou de entrar.
  // Precisa do cliente admin: como o próprio vínculo dela ainda não está
  // "active", a regra normal (RLS) não deixaria ela mesma se ativar.
  if (userData.user) {
    const admin = getSupabaseAdminClient()
    await admin
      ?.from("memberships")
      .update({ status: "active" })
      .eq("user_id", userData.user.id)
      .eq("status", "invited")
  }

  redirect("/app")
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/app/entrar")
}

function traduzErroAuth(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos."
  if (m.includes("already registered") || m.includes("already exists")) return "Já existe uma conta com esse e-mail."
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar — veja sua caixa de entrada."
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 8 caracteres."
  if (m.includes("signups not allowed")) {
    return "Não encontramos uma conta com esse e-mail. Se é seu primeiro acesso, toque em “Cadastre-se grátis”."
  }
  if (m.includes("rate limit")) return "Muitos cadastros seguidos em pouco tempo. Aguarde alguns minutos e tente de novo."
  if (m.includes("email address") && m.includes("invalid")) return "Esse e-mail não é válido. Confira se digitou certo."
  console.error("[traduzErroAuth] erro não mapeado:", message)
  return "Não foi possível completar a ação. Tente novamente em instantes."
}
