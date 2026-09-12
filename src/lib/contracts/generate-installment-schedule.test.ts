import { describe, expect, it } from "vitest";
import { generateInstallmentSchedule } from "./generate-installment-schedule";

describe("generateInstallmentSchedule", () => {
  it("generates one entry per parcela, numbered from 1", () => {
    const schedule = generateInstallmentSchedule({
      firstDueDate: "2026-10-01",
      installmentsCount: 3,
      installmentAmountCents: 18000,
      periodicity: "monthly",
    });

    expect(schedule).toHaveLength(3);
    expect(schedule.map((i) => i.number)).toEqual([1, 2, 3]);
    expect(schedule.every((i) => i.amountCents === 18000)).toBe(true);
  });

  it("spaces monthly installments by calendar month, clamping short months", () => {
    const schedule = generateInstallmentSchedule({
      firstDueDate: "2026-01-31",
      installmentsCount: 4,
      installmentAmountCents: 10000,
      periodicity: "monthly",
    });

    expect(schedule.map((i) => i.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-28",
      "2026-04-28",
    ]);
  });

  it("spaces weekly installments by 7 days", () => {
    const schedule = generateInstallmentSchedule({
      firstDueDate: "2026-09-01",
      installmentsCount: 3,
      installmentAmountCents: 5000,
      periodicity: "weekly",
    });

    expect(schedule.map((i) => i.dueDate)).toEqual(["2026-09-01", "2026-09-08", "2026-09-15"]);
  });

  it("spaces biweekly installments by 14 days", () => {
    const schedule = generateInstallmentSchedule({
      firstDueDate: "2026-09-01",
      installmentsCount: 3,
      installmentAmountCents: 5000,
      periodicity: "biweekly",
    });

    expect(schedule.map((i) => i.dueDate)).toEqual(["2026-09-01", "2026-09-15", "2026-09-29"]);
  });

  it("returns a single installment when installmentsCount is 1", () => {
    const schedule = generateInstallmentSchedule({
      firstDueDate: "2026-09-01",
      installmentsCount: 1,
      installmentAmountCents: 5000,
      periodicity: "monthly",
    });

    expect(schedule).toEqual([{ number: 1, dueDate: "2026-09-01", amountCents: 5000 }]);
  });
});
