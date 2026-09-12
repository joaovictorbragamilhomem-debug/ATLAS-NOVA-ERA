import { describe, expect, it } from "vitest";
import { buildCSV } from "./csv";

describe("buildCSV", () => {
  it("joins headers and rows with commas, prefixed by a UTF-8 BOM", () => {
    const csv = buildCSV(["Nome", "Cidade"], [["Maria", "Sao Paulo"]]);
    expect(csv).toBe("﻿Nome,Cidade\r\nMaria,Sao Paulo");
  });

  it("quotes a field containing the pt-BR currency comma", () => {
    const csv = buildCSV(["Valor"], [["R$ 100,00"]]);
    expect(csv).toContain('"R$ 100,00"');
  });

  it("quotes fields containing a comma", () => {
    const csv = buildCSV(["A"], [["a, b"]]);
    expect(csv).toContain('"a, b"');
  });

  it("escapes double quotes by doubling them", () => {
    const csv = buildCSV(["A"], [['say "hi"']]);
    expect(csv).toContain('"say ""hi"""');
  });

  it("quotes fields containing a newline", () => {
    const csv = buildCSV(["A"], [["line1\nline2"]]);
    expect(csv).toContain('"line1\nline2"');
  });
});
