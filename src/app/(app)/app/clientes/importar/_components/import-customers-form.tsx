"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UploadIcon, CheckCircle2Icon, AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCPF, formatPhoneBR, e164BRToDigits } from "@/lib/masks"
import { parseCustomersCSV, type ParsedCustomerRow } from "@/lib/customers/import-csv"
import { importCustomersAction } from "@/lib/customers/import-actions"

function ImportCustomersForm() {
  const router = useRouter()
  const [rows, setRows] = React.useState<ParsedCustomerRow[] | null>(null)
  const [fileName, setFileName] = React.useState("")
  const [importing, setImporting] = React.useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    setRows(parseCustomersCSV(text))
  }

  const validCount = rows?.filter((r) => !r.error).length ?? 0
  const invalidCount = rows ? rows.length - validCount : 0

  async function handleImport() {
    if (!rows) return
    setImporting(true)
    const result = await importCustomersAction(rows)
    setImporting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(
      result.skippedCount > 0
        ? `${result.createdCount} cliente(s) importado(s), ${result.skippedCount} ignorado(s).`
        : `${result.createdCount} cliente(s) importado(s).`
    )
    router.push("/app/clientes")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="csv-file">Arquivo CSV</Label>
        <Input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
      </div>

      {rows && rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-primary">
              <CheckCircle2Icon className="size-4" aria-hidden="true" /> {validCount} válida(s)
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1.5 text-warning">
                <AlertTriangleIcon className="size-4" aria-hidden="true" /> {invalidCount} com erro
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 text-left text-xs text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-3 py-2 font-medium">Linha</th>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">CPF</th>
                  <th className="px-3 py-2 font-medium">WhatsApp</th>
                  <th className="px-3 py-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.line} className={`border-t border-border ${row.error ? "bg-warning-soft/40" : ""}`}>
                    <td className="px-3 py-2 tabular-nums">{row.line}</td>
                    <td className="px-3 py-2">{row.name || "—"}</td>
                    <td className="px-3 py-2">{row.cpf ? formatCPF(row.cpf) : "—"}</td>
                    <td className="px-3 py-2">
                      {row.whatsapp ? formatPhoneBR(e164BRToDigits(row.whatsapp)) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <span className="text-warning">{row.error}</span>
                      ) : (
                        <span className="text-primary">Pronta para importar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button loading={importing} disabled={validCount === 0} onClick={handleImport} className="w-full sm:w-auto">
            <UploadIcon /> Importar {validCount} cliente(s)
          </Button>
        </>
      )}
    </div>
  )
}

export { ImportCustomersForm }
