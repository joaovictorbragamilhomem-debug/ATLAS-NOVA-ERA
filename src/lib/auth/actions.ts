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
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/api/auth/confirm?next=/app` },
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
  if (m.includes("rate limit")) return "Muitos cadastros seguidos em pouco tempo. Aguarde alguns minutos e tente de novo."
  if (m.includes("email address") && m.includes("invalid")) return "Esse e-mail não é válido. Confira se digitou certo."
  console.error("[traduzErroAuth] erro não mapeado:", message)
  return "Não foi possível completar a ação. Tente novamente em instantes."
}
