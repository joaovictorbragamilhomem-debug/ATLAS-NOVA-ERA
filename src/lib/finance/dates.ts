// Datas de parcela são só "dia" (sem hora) — comparamos como data de
// calendário, nunca como instante, para não sofrer com fuso horário.
// "Hoje" é sempre calculado no fuso America/Sao_Paulo, conforme a regra
// do projeto, mesmo que o servidor rode em UTC (caso comum na Vercel).

export function todayInSaoPauloISODate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function daysBetweenISODates(fromISODate: string, toISODate: string): number {
  const from = Date.parse(`${fromISODate}T00:00:00Z`);
  const to = Date.parse(`${toISODate}T00:00:00Z`);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}
