import { describe, expect, it } from "vitest";
import { buildOnboardingSteps, isOnboardingComplete, type OnboardingInput } from "./build-onboarding-steps";

const EMPTY_ORG: OnboardingInput = {
  role: "owner",
  firstCustomerId: null,
  hasContract: false,
  whatsappConnected: false,
};

describe("buildOnboardingSteps", () => {
  it("lists all three steps for the owner, in order", () => {
    const steps = buildOnboardingSteps(EMPTY_ORG);
    expect(steps.map((s) => s.id)).toEqual(["customer", "contract", "whatsapp"]);
  });

  it("only lists steps the role is allowed to perform", () => {
    expect(buildOnboardingSteps({ ...EMPTY_ORG, role: "manager" }).map((s) => s.id)).toEqual([
      "customer",
      "contract",
    ]);
    expect(buildOnboardingSteps({ ...EMPTY_ORG, role: "operator" }).map((s) => s.id)).toEqual(["customer"]);
  });

  it("locks the contract step (no link) until a customer exists", () => {
    const contract = buildOnboardingSteps(EMPTY_ORG).find((s) => s.id === "contract")!;
    expect(contract.locked).toBe(true);
    expect(contract.href).toBeNull();
  });

  it("links the contract step straight to the first customer's new-contract page", () => {
    const steps = buildOnboardingSteps({ ...EMPTY_ORG, firstCustomerId: "abc-123" });
    const customer = steps.find((s) => s.id === "customer")!;
    const contract = steps.find((s) => s.id === "contract")!;
    expect(customer.done).toBe(true);
    expect(contract.locked).toBe(false);
    expect(contract.href).toBe("/app/clientes/abc-123/contratos/novo");
  });

  it("marks steps done from the data, independently", () => {
    const steps = buildOnboardingSteps({
      role: "owner",
      firstCustomerId: "abc-123",
      hasContract: true,
      whatsappConnected: false,
    });
    expect(steps.map((s) => [s.id, s.done])).toEqual([
      ["customer", true],
      ["contract", true],
      ["whatsapp", false],
    ]);
  });

  it("never locks a contract step that is already done", () => {
    const contract = buildOnboardingSteps({ ...EMPTY_ORG, hasContract: true }).find((s) => s.id === "contract")!;
    expect(contract.locked).toBe(false);
  });
});

describe("isOnboardingComplete", () => {
  it("is false while any step is pending", () => {
    expect(isOnboardingComplete(buildOnboardingSteps(EMPTY_ORG))).toBe(false);
    expect(
      isOnboardingComplete(
        buildOnboardingSteps({ role: "owner", firstCustomerId: "x", hasContract: true, whatsappConnected: false })
      )
    ).toBe(false);
  });

  it("is true once every step for the role is done", () => {
    expect(
      isOnboardingComplete(
        buildOnboardingSteps({ role: "owner", firstCustomerId: "x", hasContract: true, whatsappConnected: true })
      )
    ).toBe(true);
    // A manager never sees the WhatsApp step, so it doesn't block completion.
    expect(
      isOnboardingComplete(
        buildOnboardingSteps({ role: "manager", firstCustomerId: "x", hasContract: true, whatsappConnected: false })
      )
    ).toBe(true);
  });
});
