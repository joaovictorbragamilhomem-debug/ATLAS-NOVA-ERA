import { onlyDigits, e164BRToDigits } from "@/lib/masks";

// O celular brasileiro tem um "nono dígito" inconsistente: a Meta às vezes
// manda o número com ele, às vezes sem — comparar dígito a dígito perderia
// cliente de verdade. Aqui a gente compara só DDD + últimos 8 dígitos
// (ignora um "9" opcional logo depois do DDD).
export function normalizeForMatch(digits: string): string {
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const last8 = rest.length > 8 ? rest.slice(-8) : rest;
  return ddd + last8;
}

// customerWhatsapp: como fica salvo em customers.whatsapp (E.164, "+55...").
// metaFrom: como a Meta manda no webhook (só dígitos, sem "+", ex. "5511999998888").
export function matchesWhatsAppNumber(customerWhatsapp: string, metaFrom: string): boolean {
  const customerDigits = e164BRToDigits(customerWhatsapp);
  const fromDigits = onlyDigits(metaFrom).replace(/^55/, "");
  if (!customerDigits || !fromDigits) return false;
  return normalizeForMatch(customerDigits) === normalizeForMatch(fromDigits);
}
