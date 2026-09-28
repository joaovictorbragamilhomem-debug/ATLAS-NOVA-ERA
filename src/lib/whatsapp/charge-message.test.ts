import { describe, expect, it } from "vitest";
import { buildChargeMessage, buildWaMeUrl } from "./charge-message";

const base = {
  empresa: "Loja Exemplo",
  numero_parcela: "2/10",
  vencimento: "30/09/2026",
  saldo_restante: "R$ 150,00",
  dias_atraso: "0",
  dias_para_vencer: "5",
};

describe("buildChargeMessage", () => {
  it("writes a reminder before the due date, greeting by first name", () => {
    expect(buildChargeMessage(base, "Maria da Silva", false)).toBe(
      "Olá, Maria! Passando para lembrar que a parcela 2/10 do seu crediário com Loja Exemplo, no valor de R$ 150,00, " +
        "vence em 30/09/2026.\n\nSe já pagou, desconsidere esta mensagem."
    );
  });

  it("says 'vence hoje' on the due date", () => {
    const message = buildChargeMessage({ ...base, dias_para_vencer: "0" }, "Maria", false);
    expect(message).toContain("vence hoje (30/09/2026)");
  });

  it("shows days late and the updated amount when overdue", () => {
    const message = buildChargeMessage(
      { ...base, dias_para_vencer: "0", dias_atraso: "1", saldo_restante: "R$ 153,05" },
      "Maria",
      false
    );
    expect(message).toContain("venceu em 30/09/2026 e está em aberto há 1 dia. Valor atualizado: R$ 153,05.");
  });

  it("announces the Pix code as a separate next message", () => {
    expect(buildChargeMessage(base, "Maria", true)).toContain("Vou te mandar o código Pix na próxima mensagem");
    expect(buildChargeMessage(base, "Maria", false)).not.toContain("Pix");
  });
});

describe("buildWaMeUrl", () => {
  it("uses only the digits of the phone and encodes the text", () => {
    expect(buildWaMeUrl("+55 94 99292-4743", "Olá, Maria! R$ 1,11")).toBe(
      "https://wa.me/5594992924743?text=Ol%C3%A1%2C%20Maria!%20R%24%201%2C11"
    );
  });
});
