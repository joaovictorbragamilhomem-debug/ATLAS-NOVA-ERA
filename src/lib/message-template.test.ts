import { describe, expect, it } from "vitest";
import { extractTemplateVariables, renderTemplate, renderTemplateToPositionalParams } from "./message-template";

describe("renderTemplate", () => {
  it("substitutes known variables", () => {
    expect(renderTemplate("Oi {{nome}}, sua parcela é {{valor_parcela}}", { nome: "Maria", valor_parcela: "R$ 180,00" })).toBe(
      "Oi Maria, sua parcela é R$ 180,00"
    );
  });

  it("leaves unknown variables untouched", () => {
    expect(renderTemplate("Oi {{nome}}, {{desconhecida}}", { nome: "Maria" })).toBe("Oi Maria, {{desconhecida}}");
  });
});

describe("extractTemplateVariables", () => {
  it("returns variable names in order of first appearance, without duplicates", () => {
    expect(extractTemplateVariables("{{nome}} {{valor}} {{nome}}")).toEqual(["nome", "valor"]);
  });

  it("returns an empty array when there are no variables", () => {
    expect(extractTemplateVariables("mensagem sem variáveis")).toEqual([]);
  });
});

describe("renderTemplateToPositionalParams", () => {
  it("returns values in the same order the variables appear in the template", () => {
    const body = "Oi {{nome}}, sua parcela de {{valor_parcela}} vence em {{vencimento}}.";
    const params = renderTemplateToPositionalParams(body, {
      nome: "Maria",
      valor_parcela: "R$ 180,00",
      vencimento: "16/07/2026",
    });
    expect(params).toEqual(["Maria", "R$ 180,00", "16/07/2026"]);
  });

  it("uses an empty string for a variable with no known value", () => {
    const params = renderTemplateToPositionalParams("Oi {{nome}}, {{desconhecida}}", { nome: "Maria" });
    expect(params).toEqual(["Maria", ""]);
  });
});
