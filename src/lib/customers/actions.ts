"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable"
import { logAudit } from "@/lib/audit/log"
import { isValidCPF } from "@/lib/validators"
import { onlyDigits, phoneDigitsToE164BR } from "@/lib/masks"

export type CustomerActionState = { error: string | null }

type CustomerFields = {
  name: string
  cpf: string
  whatsapp: string
  email: string | null
  cep: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_district: string | null
  address_city: string | null
  address_state: string | null
  notes: string | null
  tags: string[]
}

function parseCustomerFields(formData: FormData): { error: string } | { fields: CustomerFields } {
  const name = String(formData.get("name") ?? "").trim()
  const cpf = onlyDigits(String(formData.get("cpf") ?? ""))
  const whatsappDigits = onlyDigits(String(formData.get("whatsapp") ?? ""))
  const email = String(formData.get("email") ?? "").trim() || null
  const cep = onlyDigits(String(formData.get("cep") ?? "")) || null
  const tagsRaw = String(formData.get("tags") ?? "").trim()

  if (!name) return { error: "Informe o nome do cliente." }
  if (!isValidCPF(cpf)) return { error: "CPF inválido — confira os números." }
  if (whatsappDigits.length < 10) return { error: "Informe um WhatsApp válido, com DDD." }

  return {
    fields: {
      name,
      cpf,
      whatsapp: phoneDigitsToE164BR(whatsappDigits),
      email,
      cep,
      address_street: String(formData.get("addressStreet") ?? "").trim() || null,
      address_number: String(formData.get("addressNumber") ?? "").trim() || null,
      address_complement: String(formData.get("addressComplement") ?? "").trim() || null,
      address_district: String(formData.get("addressDistrict") ?? "").trim() || null,
      address_city: String(formData.get("addressCity") ?? "").trim() || null,
      address_state: String(formData.get("addressState") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    },
  }
}

export async function createCustomerAction(_prev: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const membership = await getCurrentMembership()
  if (!membership) return { error: "Sessão expirada — entre novamente." }

  const blocked = await assertOrganizationIsWritable(membership.organizationId)
  if (blocked) return { error: blocked }

  const parsed = parseCustomerFields(formData)
  if ("error" in parsed) return { error: parsed.error }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("customers")
    .insert({ organization_id: membership.organizationId, created_by: membership.userId, ...parsed.fields })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return { error: "Já existe um cliente com esse CPF nesta conta." }
    return { error: error.message }
  }

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "customer.created",
    entityType: "customer",
    entityId: data.id,
    after: parsed.fields,
  })

  revalidatePath("/app/clientes")
  redirect(`/app/clientes/${data.id}`)
}

export async function updateCustomerAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const membership = await getCurrentMembership()
  if (!membership) return { error: "Sessão expirada — entre novamente." }

  const blocked = await assertOrganizationIsWritable(membership.organizationId)
  if (blocked) return { error: blocked }

  const parsed = parseCustomerFields(formData)
  if ("error" in parsed) return { error: parsed.error }

  const supabase = await getSupabaseServerClient()

  const { data: before } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle()

  const { error } = await supabase.from("customers").update(parsed.fields).eq("id", customerId)

  if (error) {
    if (error.code === "23505") return { error: "Já existe um cliente com esse CPF nesta conta." }
    return { error: error.message }
  }

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "customer.updated",
    entityType: "customer",
    entityId: customerId,
    before,
    after: parsed.fields,
  })

  revalidatePath("/app/clientes")
  revalidatePath(`/app/clientes/${customerId}`)
  redirect(`/app/clientes/${customerId}`)
}
