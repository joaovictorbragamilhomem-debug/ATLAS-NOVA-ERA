import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "chave-de-teste-nao-usar-em-producao";
});

describe("encryptToken / decryptToken", () => {
  it("round-trips a plain text token", async () => {
    const { encryptToken, decryptToken } = await import("./token-crypto");
    const original = "EAAG...um-token-bem-longo-da-meta...xyz";
    const cipherText = encryptToken(original);
    expect(cipherText).not.toContain(original);
    expect(decryptToken(cipherText)).toBe(original);
  });

  it("produces a different ciphertext each time (random IV)", async () => {
    const { encryptToken } = await import("./token-crypto");
    const a = encryptToken("mesmo-valor");
    const b = encryptToken("mesmo-valor");
    expect(a).not.toBe(b);
  });

  it("rejects a tampered ciphertext", async () => {
    const { encryptToken, decryptToken } = await import("./token-crypto");
    const cipherText = encryptToken("valor-secreto");
    const tampered = cipherText.slice(0, -4) + "abcd";
    expect(() => decryptToken(tampered)).toThrow();
  });
});
