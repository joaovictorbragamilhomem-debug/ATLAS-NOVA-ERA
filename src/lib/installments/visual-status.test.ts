import { describe, expect, it } from "vitest";
import { getInstallmentVisualStatus } from "./visual-status";

const TODAY = "2026-09-15";

describe("getInstallmentVisualStatus", () => {
  it("maps paid/renegotiated/reversed regardless of due date", () => {
    expect(getInstallmentVisualStatus({ status: "paid", due_date: "2020-01-01" }, TODAY)).toBe("paga");
    expect(getInstallmentVisualStatus({ status: "renegotiated", due_date: "2020-01-01" }, TODAY)).toBe(
      "renegociada"
    );
    expect(getInstallmentVisualStatus({ status: "reversed", due_date: "2020-01-01" }, TODAY)).toBe("estornada");
  });

  it("maps pending by comparing due_date to today", () => {
    expect(getInstallmentVisualStatus({ status: "pending", due_date: TODAY }, TODAY)).toBe("vence_hoje");
    expect(getInstallmentVisualStatus({ status: "pending", due_date: "2026-09-01" }, TODAY)).toBe("atrasada");
    expect(getInstallmentVisualStatus({ status: "pending", due_date: "2026-10-01" }, TODAY)).toBe("a_vencer");
  });

  it("treats partially_paid the same as pending for the due-date badge", () => {
    expect(getInstallmentVisualStatus({ status: "partially_paid", due_date: "2026-09-01" }, TODAY)).toBe(
      "atrasada"
    );
  });
});
