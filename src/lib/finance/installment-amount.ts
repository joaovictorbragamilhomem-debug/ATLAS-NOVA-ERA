import { daysBetweenISODates } from "./dates";

export type UpdatedAmountParams = {
  amountCents: number;
  dueDate: string; // "YYYY-MM-DD"
  referenceDate: string; // "YYYY-MM-DD" — normalmente "hoje" em America/Sao_Paulo
  lateFeePercent: number; // multa, ex.: 2 = 2%
  lateInterestMonthlyPercent: number; // juros de mora ao mês, ex.: 1 = 1% a.m.
};

export function calculateDaysLate(dueDate: string, referenceDate: string): number {
  return Math.max(0, daysBetweenISODates(dueDate, referenceDate));
}

// Valor atualizado = parcela + multa + juros de mora proporcionais aos
// dias de atraso. Tudo em centavos (inteiro) — nunca número decimal solto.
// Em dia (0 dias de atraso): não cobra multa nem juros.
export function calculateUpdatedAmountCents(params: UpdatedAmountParams): number {
  const late = calculateDaysLate(params.dueDate, params.referenceDate);
  if (late <= 0) return params.amountCents;

  const lateFeeCents = Math.round(params.amountCents * (params.lateFeePercent / 100));
  const interestCents = Math.round(
    params.amountCents * (params.lateInterestMonthlyPercent / 100) * (late / 30)
  );
  return params.amountCents + lateFeeCents + interestCents;
}

// Quanto ainda falta pagar dessa parcela, considerando o valor atualizado
// e o que já foi pago (nunca fica negativo).
export function calculateRemainingBalanceCents(updatedAmountCents: number, paidAmountCents: number): number {
  return Math.max(0, updatedAmountCents - paidAmountCents);
}
