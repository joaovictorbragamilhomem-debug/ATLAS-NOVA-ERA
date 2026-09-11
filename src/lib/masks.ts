export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 9));
  let result = parts.join(".");
  if (digits.length > 9) result += "-" + digits.slice(9, 11);
  return result;
}

export function formatPhoneBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const rest = digits.slice(2);
  const isMobile = digits.length > 10;
  const splitAt = isMobile ? 5 : 4;
  const part1 = rest.slice(0, splitAt);
  const part2 = rest.slice(splitAt);
  return `(${ddd}) ${part1}${part2 ? "-" + part2 : ""}`;
}

// Formulários internos guardam o WhatsApp em E.164 (+55DDDNUMERO), como
// definido no modelo do banco (docs/schema.md).
export function phoneDigitsToE164BR(digits: string): string {
  return `+55${onlyDigits(digits)}`;
}

export function e164BRToDigits(e164: string): string {
  return onlyDigits(e164).replace(/^55/, "");
}

// Dinheiro sempre em centavos (inteiro) — nunca ponto flutuante.
export function centsFromDigits(value: string): number {
  const digits = onlyDigits(value);
  return digits ? parseInt(digits, 10) : 0;
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date);
}
