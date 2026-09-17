import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "cn"
import { requireMembership } from "@/lib/auth/current-user"
import { getReceivablesCalendar } from "@/lib/calendar/get-receivables-calendar"
import { daysInMonth, todayInSaoPauloISODate, weekdayOfISODate, addMonthsToYearMonth } from "@/lib/finance/dates"
import { formatCentsToBRL, formatISODateToBR } from "@/lib/masks"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number)
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>
}) {
  const membership = await requireMembership()

  const { mes, dia } = await searchParams
  const today = todayInSaoPauloISODate()
  const yearMonth = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : today.slice(0, 7)

  const calendar = await getReceivablesCalendar(membership.organizationId, yearMonth)
  const totalDays = daysInMonth(yearMonth)
  const leadingBlanks = weekdayOfISODate(`${yearMonth}-01`)
  const previousMonth = addMonthsToYearMonth(yearMonth, -1)
  const nextMonth = addMonthsToYearMonth(yearMonth, 1)

  const selectedDay = dia && dia.startsWith(yearMonth) ? dia : null
  const selectedDayData = selectedDay ? calendar.get(selectedDay) : null

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendário de recebimentos</h1>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/app/calendario?mes=${previousMonth}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" /> Mês anterior
        </Link>
        <span className="text-sm font-medium">{monthLabel(yearMonth)}</span>
        <Link
          href={`/app/calendario?mes=${nextMonth}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Próximo mês <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNumber = i + 1
          const date = `${yearMonth}-${String(dayNumber).padStart(2, "0")}`
          const dayData = calendar.get(date)
          const isToday = date === today
          const isSelected = date === selectedDay

          return (
            <Link
              key={date}
              href={`/app/calendario?mes=${yearMonth}&dia=${date}`}
              className={cn(
                "flex min-h-16 flex-col gap-1 rounded-lg border border-border bg-card p-1.5 text-left transition-colors hover:bg-muted/50",
                isToday && "border-primary",
                isSelected && "bg-accent"
              )}
            >
              <span className={cn("text-xs", isToday && "font-semibold text-primary")}>{dayNumber}</span>
              {dayData && (
                <span className="text-[0.65rem] leading-tight font-medium text-muted-foreground">
                  {dayData.count}x · {formatCentsToBRL(dayData.totalCents)}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {selectedDay && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{formatISODateToBR(selectedDay)}</h2>
          {!selectedDayData ? (
            <p className="text-sm text-muted-foreground">Nenhuma parcela vencendo nesse dia.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedDayData.items.map((item) => (
                <li key={item.installmentId}>
                  <Link
                    href={`/app/contratos/${item.contractId}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{item.customerName}</span>
                    <span className="font-medium tabular-nums">{formatCentsToBRL(item.remainingCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  )
}
