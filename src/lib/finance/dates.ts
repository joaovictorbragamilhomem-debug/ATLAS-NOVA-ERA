// Datas de parcela são só "dia" (sem hora) — comparamos como data de
// calendário, nunca como instante, para não sofrer com fuso horário.
// "Hoje" é sempre calculado no fuso America/Sao_Paulo, conforme a regra
// do projeto, mesmo que o servidor rode em UTC (caso comum na Vercel).

export function toSaoPauloISODate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

export function todayInSaoPauloISODate(): string {
  return toSaoPauloISODate(new Date());
}

export function daysBetweenISODates(fromISODate: string, toISODate: string): number {
  const from = Date.parse(`${fromISODate}T00:00:00Z`);
  const to = Date.parse(`${toISODate}T00:00:00Z`);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

// Conversão para uso em <input type="date"> / calendário (Date local do
// navegador) — sempre usando getFullYear/getMonth/getDate (hora local), nunca
// toISOString(), que converte para UTC e pode "voltar um dia" dependendo do
// fuso da máquina de quem está usando o sistema.
export function localDateToISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isoDateToLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoDateFromUTCParts(year: number, monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(year, monthIndex, day));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToISODate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return isoDateFromUTCParts(year, month - 1, day + days);
}

// Soma meses de calendário, "grudando" no último dia do mês de destino
// quando ele não existir (ex.: 31/jan + 1 mês = 28 ou 29/fev, nunca 03/mar).
// O Postgres/JS por padrão "estouram" para o mês seguinte em vez de grudar,
// o que faria o carnê pular datas de forma estranha para quem parcela todo
// dia 31.
export function addMonthsToISODate(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const targetMonthIndex = month - 1 + months;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return isoDateFromUTCParts(year, targetMonthIndex, clampedDay);
}

export type Periodicity = "weekly" | "biweekly" | "monthly";

export function nextDueDateForPeriodicity(isoDate: string, periodicity: Periodicity): string {
  if (periodicity === "weekly") return addDaysToISODate(isoDate, 7);
  if (periodicity === "biweekly") return addDaysToISODate(isoDate, 14);
  return addMonthsToISODate(isoDate, 1);
}

// Helpers de calendário mensal (para telas como /app/calendario) — sempre a
// partir de "YYYY-MM", sem hora nem fuso envolvidos.
export function daysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// 0 = domingo ... 6 = sábado, igual ao Date.getDay().
export function weekdayOfISODate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addMonthsToYearMonth(yearMonth: string, months: number): string {
  return addMonthsToISODate(`${yearMonth}-01`, months).slice(0, 7);
}
