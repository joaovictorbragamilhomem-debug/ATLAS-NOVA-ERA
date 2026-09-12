import { describe, it, expect } from "vitest";
import {
  calculateDaysLate,
  calculateUpdatedAmountCents,
  calculateRemainingBalanceCents,
} from "./installment-amount";
import { daysBetweenISODates, todayInSaoPauloISODate } from "./dates";

describe("calculateDaysLate", () => {
  it("é 0 no dia do vencimento", () => {
    expect(calculateDaysLate("2026-09-15", "2026-09-15")).toBe(0);
  });

  it("é 0 antes do vencimento (nunca negativo)", () => {
    expect(calculateDaysLate("2026-09-15", "2026-09-10")).toBe(0);
  });

  it("conta os dias corridos de atraso", () => {
    expect(calculateDaysLate("2026-09-15", "2026-09-20")).toBe(5);
  });

  it("atravessa virada de mês corretamente", () => {
    expect(calculateDaysLate("2026-09-28", "2026-10-03")).toBe(5);
  });
});

describe("calculateUpdatedAmountCents", () => {
  const base = {
    amountCents: 25000, // R$ 250,00
    lateFeePercent: 2, // 2%
    lateInterestMonthlyPercent: 1, // 1% a.m.
  };

  it("em dia: não cobra multa nem juros", () => {
    const result = calculateUpdatedAmountCents({
      ...base,
      dueDate: "2026-09-15",
      referenceDate: "2026-09-15",
    });
    expect(result).toBe(25000);
  });

  it("antes do vencimento: também não cobra nada", () => {
    const result = calculateUpdatedAmountCents({
      ...base,
      dueDate: "2026-09-15",
      referenceDate: "2026-09-10",
    });
    expect(result).toBe(25000);
  });

  it("1 dia de atraso: aplica a multa inteira + 1 dia de juros", () => {
    // multa: 25000 * 2% = 500
    // juros: 25000 * 1% * (1/30) = 8.33 -> arredonda para 8
    const result = calculateUpdatedAmountCents({
      ...base,
      dueDate: "2026-09-15",
      referenceDate: "2026-09-16",
    });
    expect(result).toBe(25000 + 500 + 8);
  });

  it("30 dias de atraso: juros equivalem a 1 mês cheio", () => {
    // multa: 500 (fixa, não dobra com o tempo)
    // juros: 25000 * 1% * (30/30) = 250
    const result = calculateUpdatedAmountCents({
      ...base,
      dueDate: "2026-08-15",
      referenceDate: "2026-09-14",
    });
    expect(result).toBe(25000 + 500 + 250);
  });

  it("sem multa nem juros configurados (0%): valor não muda mesmo atrasado", () => {
    const result = calculateUpdatedAmountCents({
      amountCents: 25000,
      lateFeePercent: 0,
      lateInterestMonthlyPercent: 0,
      dueDate: "2026-09-15",
      referenceDate: "2026-10-15",
    });
    expect(result).toBe(25000);
  });

  it("nunca retorna valor quebrado (sempre inteiro, em centavos)", () => {
    const result = calculateUpdatedAmountCents({
      amountCents: 33333,
      lateFeePercent: 1.5,
      lateInterestMonthlyPercent: 0.99,
      dueDate: "2026-09-15",
      referenceDate: "2026-09-22",
    });
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("calculateRemainingBalanceCents", () => {
  it("nada pago: falta o valor inteiro", () => {
    expect(calculateRemainingBalanceCents(25000, 0)).toBe(25000);
  });

  it("pago parcialmente: falta a diferença", () => {
    expect(calculateRemainingBalanceCents(25000, 10000)).toBe(15000);
  });

  it("pago integralmente: não falta nada", () => {
    expect(calculateRemainingBalanceCents(25000, 25000)).toBe(0);
  });

  it("pago a mais: nunca fica negativo", () => {
    expect(calculateRemainingBalanceCents(25000, 30000)).toBe(0);
  });
});

describe("daysBetweenISODates", () => {
  it("calcula diferença simples", () => {
    expect(daysBetweenISODates("2026-01-01", "2026-01-10")).toBe(9);
  });

  it("aceita datas invertidas (retorna negativo)", () => {
    expect(daysBetweenISODates("2026-01-10", "2026-01-01")).toBe(-9);
  });

  it("atravessa ano novo", () => {
    expect(daysBetweenISODates("2026-12-30", "2027-01-02")).toBe(3);
  });
});

describe("todayInSaoPauloISODate", () => {
  it("retorna uma data no formato YYYY-MM-DD", () => {
    expect(todayInSaoPauloISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
