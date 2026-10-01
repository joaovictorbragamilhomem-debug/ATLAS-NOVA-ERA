import { cn } from "cn"
import { formatCentsToBRL } from "@/lib/masks"
import { centsToWordsSentenceBR } from "@/lib/money-in-words"

type AmountReviewProps = {
  /** Short sentence above the amount, e.g. "Você vai registrar". */
  lead: string
  cents: number
  /** Optional line under the amount (who paid, which installment...). */
  detail?: React.ReactNode
  tone?: "default" | "danger"
  className?: string
}

// Big, double-checked amount for review steps before an action that moves or
// undoes money: the number in large digits plus the same value in words.
function AmountReview({ lead, cents, detail, tone = "default", className }: AmountReviewProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4",
        tone === "danger" ? "border-danger/30 bg-danger-soft" : "border-border bg-muted/50",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{lead}</p>
      <p
        className={cn(
          "text-3xl font-semibold tabular-nums",
          tone === "danger" ? "text-danger" : "text-foreground"
        )}
      >
        {formatCentsToBRL(cents)}
      </p>
      <p className="text-base font-medium">({centsToWordsSentenceBR(cents)})</p>
      {detail && <div className="mt-1 text-base text-foreground">{detail}</div>}
    </div>
  )
}

export { AmountReview }
