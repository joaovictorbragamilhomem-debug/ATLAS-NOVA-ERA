// The assistant only writes to customers between 08:00 and 20:00 (São
// Paulo), every day — it only answers messages the customer sent, so a
// Sunday question gets a Sunday answer (the automatic charges still skip
// Sundays). Messages that arrive at night are answered by the morning cron.

const START_HOUR = 8;
const END_HOUR = 20;

export function isAssistantBusinessHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return hour >= START_HOUR && hour < END_HOUR;
}

const WEEKDAYS_PT = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

// "2026-10-02" -> "sexta-feira". Lets the model resolve "sexta"/"amanhã".
export function weekdayNamePt(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return WEEKDAYS_PT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
