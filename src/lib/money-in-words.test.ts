import { describe, expect, it } from "vitest"
import { centsToWordsBR, centsToWordsSentenceBR, integerToWordsBR } from "./money-in-words"

describe("integerToWordsBR", () => {
  it.each([
    [0, "zero"],
    [1, "um"],
    [10, "dez"],
    [16, "dezesseis"],
    [21, "vinte e um"],
    [100, "cem"],
    [101, "cento e um"],
    [110, "cento e dez"],
    [999, "novecentos e noventa e nove"],
    [1000, "mil"],
    [1001, "mil e um"],
    [1100, "mil e cem"],
    [1500, "mil e quinhentos"],
    [1520, "mil quinhentos e vinte"],
    [2000, "dois mil"],
    [12500, "doze mil e quinhentos"],
    [100000, "cem mil"],
    [125000, "cento e vinte e cinco mil"],
    [1_000_000, "um milhão"],
    [1_500_000, "um milhão e quinhentos mil"],
    [2_000_000, "dois milhões"],
    [2_000_001, "dois milhões e um"],
    [2_100_300, "dois milhões, cem mil e trezentos"],
    [1_005_000, "um milhão e cinco mil"],
    [1_234_567, "um milhão, duzentos e trinta e quatro mil quinhentos e sessenta e sete"],
  ])("%i -> %s", (value, expected) => {
    expect(integerToWordsBR(value)).toBe(expected)
  })

  it("rejects negatives and fractions", () => {
    expect(() => integerToWordsBR(-1)).toThrow()
    expect(() => integerToWordsBR(1.5)).toThrow()
  })
})

describe("centsToWordsBR", () => {
  it.each([
    [0, "zero real"],
    [1, "um centavo"],
    [5, "cinco centavos"],
    [100, "um real"],
    [150, "um real e cinquenta centavos"],
    [200, "dois reais"],
    [1_250_000, "doze mil e quinhentos reais"],
    [1_250_099, "doze mil e quinhentos reais e noventa e nove centavos"],
    [100_000_000, "um milhão de reais"],
    [300_000_000, "três milhões de reais"],
    [150_000_000, "um milhão e quinhentos mil reais"],
    [33_333, "trezentos e trinta e três reais e trinta e três centavos"],
  ])("%i cents -> %s", (cents, expected) => {
    expect(centsToWordsBR(cents)).toBe(expected)
  })

  it("rejects invalid input", () => {
    expect(() => centsToWordsBR(-100)).toThrow()
    expect(() => centsToWordsBR(10.5)).toThrow()
  })
})

describe("centsToWordsSentenceBR", () => {
  it("capitalizes the first letter", () => {
    expect(centsToWordsSentenceBR(1_250_000)).toBe("Doze mil e quinhentos reais")
  })
})
