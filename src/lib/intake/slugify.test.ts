import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Crédito da Vila")).toBe("credito-da-vila");
  });

  it("strips accents", () => {
    expect(slugify("São João Ltda")).toBe("sao-joao-ltda");
  });

  it("collapses non-alphanumeric runs into a single dash", () => {
    expect(slugify("Loja #1 -- Centro!!")).toBe("loja-1-centro");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("--Empresa--")).toBe("empresa");
  });
});
