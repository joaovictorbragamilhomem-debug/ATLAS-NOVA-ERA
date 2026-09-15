import { describe, expect, it } from "vitest";
import { buildPixCopiaCola } from "./emv-br-code";

// Recalcula o CRC16 de forma independente do código de produção, só pra
// não "testar a própria implementação usando ela mesma".
function independentCrc16(input: string): string {
  let crc = 0xffff;
  for (const char of input) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

describe("buildPixCopiaCola", () => {
  const base = { pixKey: "11999998888", merchantName: "Atlas Nova Era", merchantCity: "Sao Paulo", amountCents: 15000 };

  it("começa com o indicador de formato do payload (000201)", () => {
    expect(buildPixCopiaCola(base).startsWith("000201")).toBe(true);
  });

  it("termina com um CRC16 que bate com um cálculo independente", () => {
    const code = buildPixCopiaCola(base);
    const withoutCrc = code.slice(0, -4);
    const crc = code.slice(-4);
    expect(crc).toBe(independentCrc16(withoutCrc));
  });

  it("formata o valor em reais com 2 casas, a partir dos centavos", () => {
    const code = buildPixCopiaCola({ ...base, amountCents: 1050 });
    expect(code).toContain("540510.50");
  });

  it("tira acento e corta nome/cidade no tamanho máximo do padrão Pix", () => {
    const code = buildPixCopiaCola({
      ...base,
      merchantName: "São José do Comércio e Crédito Ltda ME",
      merchantCity: "São José dos Campos",
    });
    expect(code).not.toMatch(/[áàâãéêíóôõúüç]/i);
    // "São José dos Campos" sem acento vira "Sao Jose dos Campos" (19
    // chars) — cortado nos 15 chars que o campo "cidade" do Pix permite.
    expect(code).toContain("Sao Jose dos Ca");
  });

  it("recusa chave Pix vazia", () => {
    expect(() => buildPixCopiaCola({ ...base, pixKey: "" })).toThrow();
    expect(() => buildPixCopiaCola({ ...base, pixKey: "   " })).toThrow();
  });

  it("é determinístico — mesma entrada gera sempre o mesmo código", () => {
    expect(buildPixCopiaCola(base)).toBe(buildPixCopiaCola(base));
  });
});
