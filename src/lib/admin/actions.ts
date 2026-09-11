"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSuperAdmin } from "./is-super-admin"

async function assertSuperAdmin() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isSuperAdmin(user?.email)) throw new Error("Não autorizado")
}

export async function extendTrialAction(organizationId: string, days: number): Promise<{ error: string | null }> {
  await assertSuperAdmin()
  const admin = getSupabaseAdminClient()
  if (!admin) return { error: "Supabase não configurado." }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("trial_ends_at")
    .eq("organization_id", organizationId)
    .maybeSingle()
  if (!sub) return { error: "Assinatura não encontrada." }

  const base = sub.trial_ends_at ? new Date(sub.trial_ends_at) : new Date()
  const newTrialEndsAt = new Date(Math.max(base.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000)

  const { error } = await admin
    .from("subscriptions")
    .update({ status: "trialing", trial_ends_at: newTrialEndsAt.toISOString() })
    .eq("organization_id", organizationId)

  if (error) return { error: error.message }
  revalidatePath("/app/admin")
  return { error: null }
}

export async function grantPlanAction(
  organizationId: string,
  plan: "monthly" | "annual" | "lifetime"
): Promise<{ error: string | null }> {
  await assertSuperAdmin()
  const admin = getSupabaseAdminClient()
  if (!admin) return { error: "Supabase não configurado." }

  const { error } = await admin
    .from("subscriptions")
    .update({ plan, status: plan === "lifetime" ? "lifetime" : "active" })
    .eq("organization_id", organizationId)

  if (error) return { error: error.message }
  revalidatePath("/app/admin")
  return { error: null }
}
