"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { centsFromDigits } from "@/lib/masks";
import { generateInstallmentSchedule } from "@/lib/contracts/generate-installment-schedule";
import type { Periodicity } from "@/lib/finance/dates";

export type ContractActionState = { error: string | null };

const PERIODICITIES: Periodicity[] = ["weekly", "biweekly", "monthly"];

function parsePercent(raw: FormDataEntryValue | null): number {
  const value = Number(String(raw ?? "0").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : 0;
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

  const supabase = await getSupabaseServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return { error: "Cliente não encontrado." };

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      organization_id: membership.organizationId,
      customer_id: customerId,
      principal_amount_cents: principalAmountCents,
      installments_count: installmentsCount,
      periodicity,
      first_due_date: firstDueDate,
      installment_amount_cents: installmentAmountCents,
      late_fee_percent: lateFeePercent,
      late_interest_monthly_percent: lateInterestMonthlyPercent,
      notes,
      created_by: membership.userId,
    })
    .select("id")
    .single();

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Não foi possível criar o contrato." };
  }

  const schedule = generateInstallmentSchedule({
    firstDueDate,
    installmentsCount,
    installmentAmountCents,
    periodicity,
  });

  const { error: installmentsError } = await supabase.from("installments").insert(
    schedule.map((item) => ({
      contract_id: contract.id,
      organization_id: membership.organizationId,
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

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "contract.created",
    entityType: "contract",
    entityId: contract.id,
    after: {
      customer_id: customerId,
      principal_amount_cents: principalAmountCents,
      installments_count: installmentsCount,
      periodicity,
      first_due_date: firstDueDate,
      installment_amount_cents: installmentAmountCents,
    },
  });

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/contratos/${contract.id}`);
}
