// Preços ainda não definidos pelo dono do produto — ver TODO no README.
// Nunca inventar um valor aqui: enquanto for `null`, a tela mostra "a definir".
export const PRICING = {
  monthlyCents: null as number | null,
  annualCents: null as number | null,
  lifetimeCents: null as number | null,
};

export function calculateAnnualSavingsPercent(
  monthlyCents: number | null,
  annualCents: number | null
): number | null {
  if (!monthlyCents || !annualCents) return null;
  const yearlyIfMonthly = monthlyCents * 12;
  if (annualCents >= yearlyIfMonthly) return null;
  return Math.round((1 - annualCents / yearlyIfMonthly) * 100);
}
