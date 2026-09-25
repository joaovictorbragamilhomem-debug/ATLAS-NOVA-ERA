import { describe, expect, it } from "vitest";
import { parsePixKey } from "./pix-key";

describe("parsePixKey", () => {
  it("recognizes a phone key with +55, ignoring spaces, dashes and parentheses", () => {
    expect(parsePixKey("+5594992924743")).toEqual({ type: "PHONE", key: "+5594992924743" });
    expect(parsePixKey("+55 (94) 99292-4743")).toEqual({ type: "PHONE", key: "+5594992924743" });
  });

  it("recognizes a valid CPF, with or without punctuation, as digits only", () => {
    expect(parsePixKey("529.982.247-25")).toEqual({ type: "CPF", key: "52998224725" });
    expect(parsePixKey("52998224725")).toEqual({ type: "CPF", key: "52998224725" });
  });

  it("recognizes a CNPJ as digits only", () => {
    expect(parsePixKey("40.948.203/0001-29")).toEqual({ type: "CNPJ", key: "40948203000129" });
  });

  it("recognizes e-mail and random (EVP) keys as typed", () => {
    expect(parsePixKey("contato@atlasnovaera.com.br")).toEqual({ type: "EMAIL", key: "contato@atlasnovaera.com.br" });
    expect(parsePixKey("123e4567-e89b-12d3-a456-426614174000")).toEqual({
      type: "EVP",
      key: "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("refuses to guess when 11 digits are not a valid CPF (could be a phone without +55)", () => {
    expect(parsePixKey("94992924743")).toBeNull();
  });

  it("returns null for empty or unrecognized keys", () => {
    expect(parsePixKey("   ")).toBeNull();
    expect(parsePixKey("minha chave")).toBeNull();
  });
});
