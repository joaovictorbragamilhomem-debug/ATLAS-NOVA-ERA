import { describe, expect, it } from "vitest";
import { matchesWhatsAppNumber } from "./phone-match";

describe("matchesWhatsAppNumber", () => {
  it("matches when both sides include the 9th digit", () => {
    expect(matchesWhatsAppNumber("+5511999998888", "5511999998888")).toBe(true);
  });

  it("matches when the customer record has the 9th digit but Meta sends without it", () => {
    expect(matchesWhatsAppNumber("+5511999998888", "551199998888")).toBe(true);
  });

  it("matches when the customer record has no 9th digit but Meta sends with it", () => {
    expect(matchesWhatsAppNumber("+551199998888", "5511999998888")).toBe(true);
  });

  it("does not match a different number", () => {
    expect(matchesWhatsAppNumber("+5511999998888", "5511988887777")).toBe(false);
  });

  it("does not match a different DDD", () => {
    expect(matchesWhatsAppNumber("+5511999998888", "5521999998888")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(matchesWhatsAppNumber("", "5511999998888")).toBe(false);
    expect(matchesWhatsAppNumber("+5511999998888", "")).toBe(false);
  });
});
