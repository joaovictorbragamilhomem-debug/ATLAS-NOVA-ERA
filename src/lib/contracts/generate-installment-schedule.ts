import { nextDueDateForPeriodicity, type Periodicity } from "@/lib/finance/dates";

export type GeneratedInstallment = {
  number: number;
  dueDate: string;
  amountCents: number;
};

export type GenerateInstallmentScheduleParams = {
  firstDueDate: string;
  installmentsCount: number;
  installmentAmountCents: number;
  periodicity: Periodicity;
};

// O valor de cada parcela vem pronto do contrato (installment_amount_cents já
// inclui o que o dono decidiu cobrar) — aqui só distribuímos as datas de
// vencimento, uma por parcela, sem nenhum arredondamento de centavos.
export function generateInstallmentSchedule(
  params: GenerateInstallmentScheduleParams
): GeneratedInstallment[] {
  const schedule: GeneratedInstallment[] = [];
  let dueDate = params.firstDueDate;

  for (let number = 1; number <= params.installmentsCount; number++) {
    schedule.push({ number, dueDate, amountCents: params.installmentAmountCents });
    dueDate = nextDueDateForPeriodicity(dueDate, params.periodicity);
  }

  return schedule;
}
