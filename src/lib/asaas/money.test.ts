import { describe, expect, it } from "vitest";
import { centsToReais, reaisToCents } from "./money";

describe("centsToReais", () => {
  it("converts whole reais", () => {
    expect(centsToReais(10000)).toBe(100);
  });

  it("converts cents that don't round evenly", () => {
    expect(centsToReais(1999)).toBe(19.99);
  });

  it("rounds a fractional cent before converting", () => {
    expect(centsToReais(1999.6)).toBe(20);
  });
});

describe("reaisToCents", () => {
  it("converts whole reais", () => {
    expect(reaisToCents(100)).toBe(10000);
  });

  it("avoids float rounding drift on common decimal values", () => {
    // 19.99 * 100 sofre erro de ponto flutuante sem o Math.round interno.
    expect(reaisToCents(19.99)).toBe(1999);
  });

  it("round-trips with centsToReais", () => {
    expect(reaisToCents(centsToReais(4590))).toBe(4590);
  });
});
