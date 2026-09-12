import { describe, expect, it } from "vitest";
import { parseCustomersCSV } from "./import-csv";

const VALID_CPF = "529.982.247-25";

describe("parseCustomersCSV", () => {
  it("parses a well-formed CSV with known headers", () => {
    const csv = `nome,cpf,whatsapp,email\nMaria Souza,${VALID_CPF},11988887777,maria@example.com`;
    const rows = parseCustomersCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].error).toBeNull();
    expect(rows[0].name).toBe("Maria Souza");
    expect(rows[0].whatsapp).toBe("+5511988887777");
    expect(rows[0].email).toBe("maria@example.com");
    expect(rows[0].line).toBe(2);
  });

  it("accepts accented / alternate header names", () => {
    const csv = `Nome,CPF,Telefone,Endereço,Número,Bairro,Cidade,UF\nJoão,${VALID_CPF},11988887777,Rua A,10,Centro,SP,SP`;
    const rows = parseCustomersCSV(csv);
    expect(rows[0].error).toBeNull();
    expect(rows[0].addressStreet).toBe("Rua A");
    expect(rows[0].addressNumber).toBe("10");
    expect(rows[0].addressState).toBe("SP");
  });

  it("flags rows with an invalid CPF", () => {
    const csv = `nome,cpf,whatsapp\nCarlos,11111111111,11988887777`;
    const rows = parseCustomersCSV(csv);
    expect(rows[0].error).toBe("CPF inválido");
  });

  it("flags rows with a missing name", () => {
    const csv = `nome,cpf,whatsapp\n,${VALID_CPF},11988887777`;
    const rows = parseCustomersCSV(csv);
    expect(rows[0].error).toBe("Nome em branco");
  });

  it("flags rows with a whatsapp number that's too short", () => {
    const csv = `nome,cpf,whatsapp\nCarlos,${VALID_CPF},123`;
    const rows = parseCustomersCSV(csv);
    expect(rows[0].error).toBe("WhatsApp inválido");
  });

  it("splits a quoted tags field on comma", () => {
    const csv = `nome,cpf,whatsapp,tags\nCarlos,${VALID_CPF},11988887777,"vip, indicação"`;
    const rows = parseCustomersCSV(csv);
    expect(rows[0].tags).toEqual(["vip", "indicação"]);
  });

  it("numbers lines starting at 2 (after the header)", () => {
    const csv = `nome,cpf,whatsapp\nA,${VALID_CPF},11988887777\nB,${VALID_CPF},11988887777`;
    const rows = parseCustomersCSV(csv);
    expect(rows.map((r) => r.line)).toEqual([2, 3]);
  });
});
