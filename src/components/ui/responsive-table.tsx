import { cn } from "cn"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type ResponsiveTableColumn<T> = {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  /** Some colunas não fazem sentido na lista do celular (ex.: um ícone decorativo). */
  hideOnMobile?: boolean
  align?: "left" | "right"
  className?: string
}

type ResponsiveTableProps<T> = {
  columns: ResponsiveTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  className?: string
}

// Em telas largas isso é uma <table> de verdade. Em telas de celular vira
// uma lista de cartões, um por linha — mais fácil de ler e tocar.
function ResponsiveTable<T>({ columns, rows, getRowKey, onRowClick, className }: ResponsiveTableProps<T>) {
  return (
    <div className={className}>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.align === "right" ? "text-right" : undefined}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(col.align === "right" && "text-right tabular-nums", col.className)}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm",
              onRowClick && "cursor-pointer active:bg-muted/50"
            )}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{col.header}</span>
                  <span className={cn("text-right font-medium", col.align === "right" && "tabular-nums")}>
                    {col.render(row)}
                  </span>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ResponsiveTable }
