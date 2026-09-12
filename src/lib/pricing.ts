// Preços definidos pelo dono do produto em 2026-09-12.
export const PRICING = {
  monthlyCents: 5690 as number | null, // R$ 56,90
  annualCents: 56715 as number | null, // R$ 567,15
  lifetimeCents: 132905 as number | null, // R$ 1.329,05
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
