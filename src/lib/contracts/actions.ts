"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { centsFromDigits } from "@/lib/masks";
import { generateInstallmentSchedule } from "@/lib/contracts/generate-installment-schedule";
import { enqueueContractCreatedMessage } from "@/lib/whatsapp/enqueue";
import type { Periodicity } from "@/lib/finance/dates";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContractActionState = { error: string | null };

const PERIODICITIES: Periodicity[] = ["weekly", "biweekly", "monthly"];

function parsePercent(raw: FormDataEntryValue | null): number {
  const value = Number(String(raw ?? "0").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

type ParsedContractFields = {
  principalAmountCents: number;
  installmentAmountCents: number;
  installmentsCount: number;
  periodicity: Periodicity;
  firstDueDate: string;
  lateFeePercent: number;
  lateInterestMonthlyPercent: number;
  notes: string | null;
};

function parseContractFields(formData: FormData): { error: string } | { fields: ParsedContractFields } {
  const principalAmountCents = centsFromDigits(String(formData.get("principalAmountCents") ?? ""));
  const installmentAmountCents = centsFromDigits(String(formData.get("installmentAmountCents") ?? ""));
  const installmentsCount = parseInt(String(formData.get("installmentsCount") ?? ""), 10);
  const periodicity = String(formData.get("periodicity") ?? "") as Periodicity;
  const firstDueDate = String(formData.get("firstDueDate") ?? "");
  const lateFeePercent = parsePercent(formData.get("lateFeePercent"));
  const lateInterestMonthlyPercent = parsePercent(formData.get("lateInterestMonthlyPercent"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (principalAmountCents <= 0) return { error: "Informe o valor total do contrato." };
  if (installmentAmountCents <= 0) return { error: "Informe o valor da parcela." };
  if (!Number.isInteger(installmentsCount) || installmentsCount <= 0) {
    return { error: "Informe um número de parcelas válido." };
  }
  if (!PERIODICITIES.includes(periodicity)) return { error: "Escolha a periodicidade das parcelas." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDueDate)) return { error: "Informe a data do primeiro vencimento." };

  return {
    fields: {
      principalAmountCents,
      installmentAmountCents,
      installmentsCount,
      periodicity,
      firstDueDate,
      lateFeePercent,
      lateInterestMonthlyPercent,
      notes,
    },
  };
}

// Cria a linha do contrato e já gera o carnê (parcelas) — usado tanto pra um
// contrato novo quanto pra uma renegociação (que também é, no fundo, um
// contrato novo, só que ligado ao antigo).
async function insertContractWithInstallments(
  supabase: SupabaseClient,
  params: ParsedContractFields & {
    organizationId: string;
    customerId: string;
    createdBy: string;
    renegotiatedFromContractId?: string;
  }
): Promise<{ contractId: string } | { error: string }> {
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      organization_id: params.organizationId,
      customer_id: params.customerId,
      principal_amount_cents: params.principalAmountCents,
      installments_count: params.installmentsCount,
      periodicity: params.periodicity,
      first_due_date: params.firstDueDate,
      installment_amount_cents: params.installmentAmountCents,
      late_fee_percent: params.lateFeePercent,
      late_interest_monthly_percent: params.lateInterestMonthlyPercent,
      notes: params.notes,
      created_by: params.createdBy,
      renegotiated_from_contract_id: params.renegotiatedFromContractId ?? null,
    })
    .select("id")
    .single();

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Não foi possível criar o contrato." };
  }

  const schedule = generateInstallmentSchedule({
    firstDueDate: params.firstDueDate,
    installmentsCount: params.installmentsCount,
    installmentAmountCents: params.installmentAmountCents,
    periodicity: params.periodicity,
  });

  const { error: installmentsError } = await supabase.from("installments").insert(
    schedule.map((item) => ({
      contract_id: contract.id,
      organization_id: params.organizationId,
      number: item.number,
      due_date: item.dueDate,
      amount_cents: item.amountCents,
    }))
  );

  if (installmentsError) {
    // Compensação manual: sem transação entre chamadas, evitamos deixar um
    // contrato "fantasma" sem nenhuma parcela.
    await supabase.from("contracts").delete().eq("id", contract.id);
    return { error: "Não foi possível gerar as parcelas. Tente novamente." };
  }

  return { contractId: contract.id };
}

export async function createContractAction(
  customerId: string,
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  // Decisão de crédito: só dono/gestor. O banco também bloqueia isso (RLS),
  // mas checar aqui dá uma mensagem amigável em vez de um erro genérico.
  if (membership.role === "operator") {
    return { error: "Só Dono ou Gestor podem criar contratos." };
  }

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const parsed = parseContractFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await getSupabaseServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return { error: "Cliente não encontrado." };

  const result = await insertContractWithInstallments(supabase, {
    ...parsed.fields,
    organizationId: membership.organizationId,
    customerId,
    createdBy: membership.userId,
  });
  if ("error" in result) return { error: result.error };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "contract.created",
    entityType: "contract",
    entityId: result.contractId,
    after: { customer_id: customerId, ...parsed.fields },
  });

  await enqueueContractCreatedMessage(result.contractId);

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/contratos/${result.contractId}`);
}

const OPEN_INSTALLMENT_STATUSES = ["pending", "partially_paid", "reversed"];

export async function renegotiateContractAction(
  oldContractId: string,
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };

  // Mesma regra do time: renegociar é coisa de Dono/Gestor.
  if (membership.role === "operator") {
    return { error: "Só Dono ou Gestor podem renegociar um contrato." };
  }

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const parsed = parseContractFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await getSupabaseServerClient();

  const { data: oldContract } = await supabase
    .from("contracts")
    .select("id, customer_id, status")
    .eq("id", oldContractId)
    .maybeSingle();
  if (!oldContract) return { error: "Contrato não encontrado." };
  if (oldContract.status !== "active") {
    return { error: "Só é possível renegociar um contrato ativo." };
  }

  const { data: openInstallments } = await supabase
    .from("installments")
    .select("id")
    .eq("contract_id", oldContractId)
    .in("status", OPEN_INSTALLMENT_STATUSES);

  if (!openInstallments || openInstallments.length === 0) {
    return { error: "Esse contrato não tem parcelas em aberto para renegociar." };
  }

  const result = await insertContractWithInstallments(supabase, {
    ...parsed.fields,
    organizationId: membership.organizationId,
    customerId: oldContract.customer_id,
    createdBy: membership.userId,
    renegotiatedFromContractId: oldContractId,
  });
  if ("error" in result) return { error: result.error };

  // Marca as parcelas antigas em aberto como substituídas. O gatilho do
  // banco (guard_installment_status_change) já exige Dono/Gestor pra esse
  // exato tipo de mudança — reforça a mesma regra checada acima.
  const openIds = openInstallments.map((i) => i.id);
  const { error: installmentsUpdateError } = await supabase
    .from("installments")
    .update({ status: "renegotiated" })
    .in("id", openIds);

  if (installmentsUpdateError) {
    await supabase.from("contracts").delete().eq("id", result.contractId);
    return { error: "Não foi possível marcar as parcelas antigas como renegociadas." };
  }

  const { error: oldContractUpdateError } = await supabase
    .from("contracts")
    .update({ status: "renegotiated" })
    .eq("id", oldContractId);
  if (oldContractUpdateError) {
    return { error: "Contrato novo criado, mas houve um erro ao atualizar o contrato antigo." };
  }

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "contract.renegotiated",
    entityType: "contract",
    entityId: result.contractId,
    before: { renegotiated_from_contract_id: oldContractId, old_open_installments: openIds.length },
    after: { customer_id: oldContract.customer_id, ...parsed.fields },
  });

  revalidatePath(`/app/contratos/${oldContractId}`);
  revalidatePath(`/app/clientes/${oldContract.customer_id}`);
  redirect(`/app/contratos/${result.contractId}`);
}
