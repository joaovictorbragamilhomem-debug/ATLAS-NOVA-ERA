import type { InstallmentStatus } from "@/components/ui/status-badge";

export type InstallmentDbStatus = "pending" | "partially_paid" | "paid" | "renegotiated" | "reversed";

// Os selos "vence hoje" / "atrasada" / "a vencer" não ficam guardados no
// banco (ver docs/schema.md) — são sempre recalculados comparando due_date
// com o dia de hoje, e só fazem sentido enquanto a parcela ainda está em
// aberto (pending/partially_paid).
export function getInstallmentVisualStatus(
  installment: { status: InstallmentDbStatus; due_date: string },
  todayISODate: string
): InstallmentStatus {
  if (installment.status === "paid") return "paga";
  if (installment.status === "renegotiated") return "renegociada";
  if (installment.status === "reversed") return "estornada";

  if (installment.due_date === todayISODate) return "vence_hoje";
  if (installment.due_date < todayISODate) return "atrasada";
  return "a_vencer";
}
