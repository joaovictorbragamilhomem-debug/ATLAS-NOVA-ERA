"use server"

import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { findOrCreateAsaasCustomer, createAsaasSubscription, createAsaasPayment, getSubscriptionInvoiceUrl } from "./client"
import { PRICING } from "@/lib/pricing"
import { onlyDigits } from "@/lib/masks"
import { isValidCPF } from "@/lib/validators"
import { getLifetimeSeatsRemaining } from "@/lib/lifetime-seats"

export type CheckoutState = { error: string | null }

const PLAN_CENTS: Record<string, number | null> = {
  monthly: PRICING.monthlyCents,
  annual: PRICING.annualCents,
  lifetime: PRICING.lifetimeCents,
}

const PLAN_DESCRIPTION: Record<string, string> = {
  monthly: "ATLAS NOVA ERA — Mensal",
  annual: "ATLAS NOVA ERA — Anual",
  lifetime: "ATLAS NOVA ERA — Vitalício",
}

export async function subscribeAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const plan = String(formData.get("plan") ?? "")
  const billingDocument = onlyDigits(String(formData.get("billingDocument") ?? ""))

  if (!["monthly", "annual", "lifetime"].includes(plan)) {
    return { error: "Plano inválido." }
  }
  if (billingDocument.length === 11 && !isValidCPF(billingDocument)) {
    return { error: "CPF inválido." }
  }
  if (billingDocument.length !== 11 && billingDocument.length !== 14) {
    return { error: "Informe um CPF ou CNPJ válido." }
  }

  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "owner") {
    return { error: "Só o Dono da conta pode assinar." }
  }

  const priceCents = PLAN_CENTS[plan]
  if (priceCents === null) {
    return { error: "Os preços ainda não foram configurados. Tente novamente mais tarde." }
  }

  if (plan === "lifetime") {
    const seatsRemaining = await getLifetimeSeatsRemaining()
    if (seatsRemaining !== null && seatsRemaining <= 0) {
      return { error: "As vagas do plano Vitalício se esgotaram. Escolha o plano Mensal ou Anual." }
    }
  }

  const supabase = await getSupabaseServerClient()
  await supabase.from("organizations").update({ billing_document: billingDocument }).eq("id", membership.organizationId)

  let invoiceUrl: string | null = null

  try {
    const customer = await findOrCreateAsaasCustomer({
      name: membership.organizationName,
      email: membership.email ?? "",
      cpfCnpj: billingDocument,
      externalReference: membership.organizationId,
    })

    let asaasSubscriptionId: string | null = null
    let asaasPaymentId: string | null = null

    if (plan === "lifetime") {
      const payment = await createAsaasPayment({
        customerId: customer.id,
        valueCents: priceCents,
        description: PLAN_DESCRIPTION[plan],
        externalReference: membership.organizationId,
      })
      invoiceUrl = payment.invoiceUrl
      asaasPaymentId = payment.id
    } else {
      const subscription = await createAsaasSubscription({
        customerId: customer.id,
        cycle: plan === "monthly" ? "MONTHLY" : "YEARLY",
        valueCents: priceCents,
        description: PLAN_DESCRIPTION[plan],
        externalReference: membership.organizationId,
      })
      asaasSubscriptionId = subscription.id
      invoiceUrl = await getSubscriptionInvoiceUrl(subscription.id)
    }

    await supabase
      .from("subscriptions")
      .update({
        plan,
        asaas_customer_id: customer.id,
        ...(asaasSubscriptionId ? { asaas_subscription_id: asaasSubscriptionId } : {}),
        ...(asaasPaymentId ? { asaas_payment_id: asaasPaymentId } : {}),
      })
      .eq("organization_id", membership.organizationId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento." }
  }

  if (!invoiceUrl) {
    return { error: "Cobrança criada, mas não consegui o link de pagamento. Veja a página de Assinatura." }
  }

  redirect(invoiceUrl)
}
