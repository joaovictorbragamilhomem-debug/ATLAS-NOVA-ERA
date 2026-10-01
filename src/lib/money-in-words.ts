// Writes a money amount (in cents) out in Brazilian Portuguese words, e.g.
// 1250000 -> "doze mil e quinhentos reais". Used in confirmation dialogs so
// the person reads the amount twice (number + words) before saving it — a
// typo of one extra zero is obvious when it says "cento e vinte e cinco mil".

const UNITS = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
]

const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]

const HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
]

// 0..999 -> words ("" for 0, so callers can skip empty groups).
function hundredsToWords(n: number): string {
  if (n === 0) return ""
  if (n === 100) return "cem"

  const parts: string[] = []
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  if (hundreds > 0) parts.push(HUNDREDS[hundreds])
  if (rest > 0) {
    if (rest < 20) {
      parts.push(UNITS[rest])
    } else {
      const tens = Math.floor(rest / 10)
      const units = rest % 10
      parts.push(units > 0 ? `${TENS[tens]} e ${UNITS[units]}` : TENS[tens])
    }
  }
  return parts.join(" e ")
}

const SCALES: { singular: string; plural: string }[] = [
  { singular: "", plural: "" },
  { singular: "mil", plural: "mil" },
  { singular: "milhão", plural: "milhões" },
  { singular: "bilhão", plural: "bilhões" },
  { singular: "trilhão", plural: "trilhões" },
]

// Non-negative integer -> words, following the usual Brazilian rules:
// "mil" (not "um mil"), "e" before the last group when it is < 100 or a round
// hundred ("mil e quinhentos", "mil e vinte"), otherwise a space ("mil
// quinhentos e vinte"), with a comma after millions for readability.
export function integerToWordsBR(value: number): string {
  if (!Number.isInteger(value) || value < 0) throw new RangeError("integerToWordsBR expects a non-negative integer")
  if (value === 0) return UNITS[0]

  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }
  if (groups.length > SCALES.length) throw new RangeError("Value too large")

  const words: { text: string; group: number; scale: number }[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    if (group === 0) continue
    let text: string
    if (i === 0) text = hundredsToWords(group)
    else if (i === 1) text = group === 1 ? "mil" : `${hundredsToWords(group)} mil`
    else text = `${hundredsToWords(group)} ${group === 1 ? SCALES[i].singular : SCALES[i].plural}`
    words.push({ text, group, scale: i })
  }

  let result = words[0].text
  for (let k = 1; k < words.length; k++) {
    const current = words[k]
    const isLast = k === words.length - 1
    const joinWithE = isLast && (current.group < 100 || current.group % 100 === 0)
    const separator = joinWithE ? " e " : words[k - 1].scale >= 2 ? ", " : " "
    result += separator + current.text
  }
  return result
}

// Whole millions/billions take "de" before the currency: "um milhão de reais",
// but "um milhão e quinhentos mil reais".
function needsDe(reais: number): boolean {
  return reais >= 1_000_000 && reais % 1_000_000 === 0
}

/**
 * Money (in cents) -> Portuguese words.
 *   1250000 -> "doze mil e quinhentos reais"
 *   100     -> "um real"
 *   150     -> "um real e cinquenta centavos"
 *   5       -> "cinco centavos"
 */
export function centsToWordsBR(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError("centsToWordsBR expects a non-negative integer")
  if (cents === 0) return "zero real"

  const reais = Math.floor(cents / 100)
  const centavos = cents % 100

  const parts: string[] = []
  if (reais > 0) {
    const currency = reais === 1 ? "real" : "reais"
    parts.push(`${integerToWordsBR(reais)} ${needsDe(reais) ? "de " : ""}${currency}`)
  }
  if (centavos > 0) {
    parts.push(`${integerToWordsBR(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`)
  }
  return parts.join(" e ")
}

/** Same as centsToWordsBR, with the first letter capitalized for display. */
export function centsToWordsSentenceBR(cents: number): string {
  const words = centsToWordsBR(cents)
  return words.charAt(0).toUpperCase() + words.slice(1)
}
