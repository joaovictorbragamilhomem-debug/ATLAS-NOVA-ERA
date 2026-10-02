import { describe, expect, it } from "vitest";
import { isAssistantBusinessHours, weekdayNamePt } from "./business-hours";
import { DEFAULT_REPLIES, finalizeDecision, isValidPromiseDate, type RawAssistantDecision } from "./decision";
import { buildSystemPrompt, buildUserPrompt, pickUrgentInstallment, type AssistantInstallment } from "./prompt";

const TODAY = "2026-10-02"; // a Friday
const ctx = { today: TODAY, hasPix: true, hasOpenInstallment: true };

function raw(partial: Partial<RawAssistantDecision>): RawAssistantDecision {
  return { reply: null, action: "none", promise_date: null, handoff_reason: null, ...partial };
}

describe("isAssistantBusinessHours", () => {
  // São Paulo is UTC-3 all year.
  it("is open on a weekday morning", () => {
    expect(isAssistantBusinessHours(new Date("2026-10-02T13:00:00Z"))).toBe(true); // Fri 10:00
  });
  it("opens at 08:00 and closes at 20:00", () => {
    expect(isAssistantBusinessHours(new Date("2026-10-05T10:59:00Z"))).toBe(false); // Mon 07:59
    expect(isAssistantBusinessHours(new Date("2026-10-05T11:00:00Z"))).toBe(true); // Mon 08:00
    expect(isAssistantBusinessHours(new Date("2026-10-05T22:59:00Z"))).toBe(true); // Mon 19:59
    expect(isAssistantBusinessHours(new Date("2026-10-05T23:00:00Z"))).toBe(false); // Mon 20:00
  });
  it("answers on weekends too, but never at night", () => {
    expect(isAssistantBusinessHours(new Date("2026-10-03T13:00:00Z"))).toBe(true); // Sat 10:00
    expect(isAssistantBusinessHours(new Date("2026-10-04T13:00:00Z"))).toBe(true); // Sun 10:00
    expect(isAssistantBusinessHours(new Date("2026-10-04T02:00:00Z"))).toBe(false); // Sat 23:00
  });
});

describe("weekdayNamePt", () => {
  it("names the weekday of an ISO date", () => {
    expect(weekdayNamePt("2026-10-02")).toBe("sexta-feira");
    expect(weekdayNamePt("2026-10-04")).toBe("domingo");
  });
});

describe("isValidPromiseDate", () => {
  it("accepts today up to 10 days ahead", () => {
    expect(isValidPromiseDate("2026-10-02", TODAY)).toBe(true);
    expect(isValidPromiseDate("2026-10-12", TODAY)).toBe(true);
  });
  it("rejects past, too far or malformed dates", () => {
    expect(isValidPromiseDate("2026-10-01", TODAY)).toBe(false);
    expect(isValidPromiseDate("2026-10-13", TODAY)).toBe(false);
    expect(isValidPromiseDate("sexta", TODAY)).toBe(false);
    expect(isValidPromiseDate(null, TODAY)).toBe(false);
  });
});

describe("finalizeDecision", () => {
  it("keeps a plain answer and allows no answer", () => {
    expect(finalizeDecision(raw({ reply: " Por nada, Maria! " }), ctx)).toEqual({ action: "none", reply: "Por nada, Maria!" });
    expect(finalizeDecision(raw({ reply: null }), ctx)).toEqual({ action: "none", reply: null });
  });

  it("sends the Pix only when there is a key and something to pay", () => {
    expect(finalizeDecision(raw({ action: "send_pix", reply: "Claro, Maria!" }), ctx)).toEqual({
      action: "send_pix",
      reply: "Claro, Maria!",
    });
    const noKey = finalizeDecision(raw({ action: "send_pix", reply: "Claro!" }), { ...ctx, hasPix: false });
    expect(noKey.action).toBe("handoff");
    expect(noKey.reply).toBe(DEFAULT_REPLIES.handoff);
    expect(finalizeDecision(raw({ action: "send_pix" }), { ...ctx, hasOpenInstallment: false }).action).toBe("handoff");
  });

  it("records a promise within the allowed range", () => {
    const decision = finalizeDecision(raw({ action: "promise", promise_date: "2026-10-09" }), ctx);
    expect(decision).toEqual({ action: "promise", reply: DEFAULT_REPLIES.promise("2026-10-09"), promiseDate: "2026-10-09" });
  });

  it("hands over a promise that is too far away, replacing the model's confirmation", () => {
    const decision = finalizeDecision(
      raw({ action: "promise", promise_date: "2026-11-20", reply: "Anotado para 20/11!" }),
      ctx
    );
    expect(decision.action).toBe("handoff");
    expect(decision.reply).toBe(DEFAULT_REPLIES.handoff);
    expect(decision.action === "handoff" && decision.reason).toContain("20/11/2026");
  });

  it("alerts the store on a payment claim, with a default reason", () => {
    expect(finalizeDecision(raw({ action: "paid_claim" }), ctx)).toEqual({
      action: "paid_claim",
      reply: DEFAULT_REPLIES.paidClaim,
      reason: "Cliente disse que já pagou — confira e dê baixa.",
    });
  });

  it("never lets the model write a Pix code", () => {
    const decision = finalizeDecision(
      raw({ action: "send_pix", reply: "Pix: 00020126580014br.gov.bcb.pix0136abc" }),
      ctx
    );
    expect(decision).toEqual({ action: "send_pix", reply: DEFAULT_REPLIES.sendPix });
  });

  it("confirms an opt-out", () => {
    expect(finalizeDecision(raw({ action: "opt_out" }), ctx)).toEqual({ action: "opt_out", reply: DEFAULT_REPLIES.optOut });
  });
});

const installment = (partial: Partial<AssistantInstallment>): AssistantInstallment => ({
  installmentId: "i",
  number: 1,
  total: 10,
  dueDate: "2026-10-10",
  remainingCents: 24000,
  daysLate: 0,
  ...partial,
});

describe("pickUrgentInstallment", () => {
  it("prefers the most overdue, then the next due", () => {
    const list = [
      installment({ installmentId: "next", dueDate: "2026-10-10" }),
      installment({ installmentId: "late2", dueDate: "2026-09-30", daysLate: 2 }),
      installment({ installmentId: "late30", dueDate: "2026-09-02", daysLate: 30 }),
    ];
    expect(pickUrgentInstallment(list)?.installmentId).toBe("late30");
    expect(pickUrgentInstallment([list[0], installment({ installmentId: "sooner", dueDate: "2026-10-05" })])?.installmentId).toBe(
      "sooner"
    );
  });
  it("ignores installments already paid off", () => {
    expect(pickUrgentInstallment([installment({ remainingCents: 0 })])).toBeNull();
  });
});

describe("prompts", () => {
  const base = {
    storeName: "Loja Bom Lar",
    customerName: "Maria da Silva",
    today: TODAY,
    installments: [installment({ number: 4, dueDate: "2026-09-30", daysLate: 2, remainingCents: 25520 })],
    hasPix: true,
    openPromiseDate: null,
    thread: [{ author: "customer" as const, body: "oi, posso pagar sexta?", occurredAt: "2026-10-02T13:15:00Z" }],
  };

  it("gives the model today's date, the first name and the open installments", () => {
    const prompt = buildUserPrompt(base);
    expect(prompt).toContain("Hoje: 2026-10-02 (sexta-feira)");
    expect(prompt).toContain("Cliente: Maria");
    expect(prompt).not.toContain("da Silva");
    expect(prompt).toContain("Parcela 4/10");
    expect(prompt).toContain("atrasada há 2 dias");
    expect(prompt).toContain("Cliente: oi, posso pagar sexta?");
  });

  it("asks the assistant to introduce itself only once", () => {
    expect(buildUserPrompt(base)).toContain("apresente-se como assistente virtual da Loja Bom Lar");
    const withIntro = buildUserPrompt({
      ...base,
      thread: [
        { author: "assistant", body: "Oi, Maria! Sou a assistente virtual da Loja Bom Lar.", occurredAt: "2026-10-01T13:00:00Z" },
        ...base.thread,
      ],
    });
    expect(withIntro).not.toContain("apresente-se");
  });

  it("names the store and the rules in the system prompt", () => {
    const system = buildSystemPrompt("Loja Bom Lar");
    expect(system).toContain('"Loja Bom Lar"');
    expect(system).toContain("never write a Pix code");
  });
});
