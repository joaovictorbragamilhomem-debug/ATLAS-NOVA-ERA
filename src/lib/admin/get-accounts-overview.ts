import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { PRICING } from "@/lib/pricing"

export type AccountRow = {
  organizationId: string
  organizationName: string
  plan: string
  status: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

export type AccountsOverview = {
  accounts: AccountRow[]
  mrrCents: number | null
  trialsEndingSoon: AccountRow[]
}

export async function getAccountsOverview(): Promise<AccountsOverview> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { accounts: [], mrrCents: null, trialsEndingSoon: [] }

  const { data } = await admin
    .from("subscriptions")
    .select("plan, status, trial_ends_at, current_period_end, organizations(id, name)")
    .order("created_at", { ascending: false })

  const accounts: AccountRow[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
    return {
      organizationId: org?.id ?? "",
      organizationName: org?.name ?? "—",
      plan: row.plan,
      status: row.status,
      trialEndsAt: row.trial_ends_at,
      currentPeriodEnd: row.current_period_end,
    }
  })

  let mrrCents: number | null = null
  if (PRICING.monthlyCents !== null && PRICING.annualCents !== null) {
    mrrCents = accounts.reduce((sum, a) => {
      if (a.status !== "active") return sum
      if (a.plan === "monthly") return sum + (PRICING.monthlyCents ?? 0)
      if (a.plan === "annual") return sum + Math.round((PRICING.annualCents ?? 0) / 12)
      return sum
    }, 0)
  }

  const in2Days = Date.now() + 2 * 24 * 60 * 60 * 1000
  const trialsEndingSoon = accounts.filter(
    (a) => a.status === "trialing" && a.trialEndsAt && new Date(a.trialEndsAt).getTime() <= in2Days
  )

  return { accounts, mrrCents, trialsEndingSoon }
}
