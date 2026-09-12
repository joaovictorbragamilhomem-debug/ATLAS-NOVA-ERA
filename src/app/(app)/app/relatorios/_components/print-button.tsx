"use client"

import { PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// "Exportar PDF" usa a caixa de impressão do próprio navegador — em
// "Salvar como PDF" isso gera um PDF de verdade, sem precisar de nenhuma
// biblioteca extra só para isso.
function PrintButton() {
  return (
    <Button type="button" size="sm" variant="secondary" onClick={() => window.print()}>
      <PrinterIcon /> Exportar PDF
    </Button>
  )
}

export { PrintButton }
