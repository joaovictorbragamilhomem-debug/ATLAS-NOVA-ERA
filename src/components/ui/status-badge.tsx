import {
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  CalendarIcon,
  RefreshCcwIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

export type InstallmentStatus =
  | "paga"
  | "vence_hoje"
  | "atrasada"
  | "a_vencer"
  | "renegociada"
  | "estornada"

const STATUS_CONFIG: Record<
  InstallmentStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  paga: {
    label: "Paga",
    icon: CheckCircle2Icon,
    className: "bg-accent text-accent-foreground",
  },
  vence_hoje: {
    label: "Vence hoje",
    icon: ClockIcon,
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  atrasada: {
    label: "Atrasada",
    icon: AlertTriangleIcon,
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
  a_vencer: {
    label: "A vencer",
    icon: CalendarIcon,
    className: "bg-muted text-muted-foreground",
  },
  renegociada: {
    label: "Renegociada",
    icon: RefreshCcwIcon,
    className: "bg-[#EDE9FE] text-[#6D28D9]",
  },
  estornada: {
    label: "Estornada",
    icon: Undo2Icon,
    className: "bg-[#F5F5F5] text-[#404040]",
  },
}

function StatusBadge({ status, className }: { status: InstallmentStatus; className?: string }) {
  const { label, icon: Icon, className: statusClassName } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-4xl px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusClassName,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

export { StatusBadge, STATUS_CONFIG }
