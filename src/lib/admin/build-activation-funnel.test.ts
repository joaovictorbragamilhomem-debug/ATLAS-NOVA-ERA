import { describe, expect, it } from "vitest";
import { buildActivationFunnel } from "./build-activation-funnel";

const none = new Set<string>();

describe("buildActivationFunnel", () => {
  it("returns the five milestones in order with zero counts and null percentages when there are no accounts", () => {
    const stages = buildActivationFunnel({
      organizationIds: [],
      withCustomer: none,
      withContract: none,
      withWhatsappConnected: none,
      paying: none,
    });
    expect(stages.map((s) => s.id)).toEqual(["signup", "customer", "contract", "whatsapp", "paying"]);
    expect(stages.every((s) => s.count === 0 && s.percentOfSignups === null)).toBe(true);
  });

  it("counts each milestone and computes the percentage of signups", () => {
    const stages = buildActivationFunnel({
      organizationIds: ["a", "b", "c", "d"],
      withCustomer: new Set(["a", "b", "c"]),
      withContract: new Set(["a", "b"]),
      withWhatsappConnected: new Set(["a"]),
      paying: new Set(["a"]),
    });
    expect(stages.map((s) => [s.id, s.count, s.percentOfSignups])).toEqual([
      ["signup", 4, 100],
      ["customer", 3, 75],
      ["contract", 2, 50],
      ["whatsapp", 1, 25],
      ["paying", 1, 25],
    ]);
  });

  it("counts milestones independently (WhatsApp without a contract still counts)", () => {
    const stages = buildActivationFunnel({
      organizationIds: ["a", "b"],
      withCustomer: none,
      withContract: none,
      withWhatsappConnected: new Set(["b"]),
      paying: none,
    });
    expect(stages.find((s) => s.id === "whatsapp")!.count).toBe(1);
    expect(stages.find((s) => s.id === "contract")!.count).toBe(0);
  });

  it("ignores ids that are not in the signup list", () => {
    const stages = buildActivationFunnel({
      organizationIds: ["a"],
      withCustomer: new Set(["a", "ghost"]),
      withContract: none,
      withWhatsappConnected: none,
      paying: none,
    });
    expect(stages.find((s) => s.id === "customer")!.count).toBe(1);
  });

  it("rounds the percentage to a whole number", () => {
    const stages = buildActivationFunnel({
      organizationIds: ["a", "b", "c"],
      withCustomer: new Set(["a"]),
      withContract: none,
      withWhatsappConnected: none,
      paying: none,
    });
    expect(stages.find((s) => s.id === "customer")!.percentOfSignups).toBe(33);
  });
});
