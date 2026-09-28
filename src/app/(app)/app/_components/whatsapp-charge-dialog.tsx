"use client"

import { toast } from "sonner"
import { CopyIcon, MessageCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ChargeLinks } from "@/lib/whatsapp/get-charge-links"

// Opens the lender's own WhatsApp (wa.me) with the message ready — works for
// every subscriber, with or without the Meta Cloud API connected.
function WhatsAppChargeDialog({ links, compact = false }: { links: ChargeLinks; compact?: boolean }) {
  async function handleCopyPix() {
    if (!links.pixCode) return
    try {
      await navigator.clipboard.writeText(links.pixCode)
      toast.success("Código Pix copiado.")
    } catch {
      toast.error("Não foi possível copiar — use o botão 2.")
    }
  }

  return (
    <Dialog>
      {compact ? (
        <DialogTrigger render={<Button size="icon-sm" variant="ghost" />}>
          <MessageCircleIcon />
          <span className="sr-only">Cobrar no WhatsApp</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" variant="secondary" />}>
          <MessageCircleIcon /> Cobrar no WhatsApp
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar {links.customerName} no WhatsApp</DialogTitle>
          <DialogDescription>
            Abre o seu WhatsApp com a mensagem pronta, é só tocar em enviar.
            {links.pixUrl && " Mande as duas, nessa ordem: assim o cliente consegue copiar só o código Pix."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button nativeButton={false} render={<a href={links.reminderUrl} target="_blank" rel="noopener noreferrer" />}>
            {links.pixUrl ? "1 · Mensagem de cobrança" : "Abrir mensagem de cobrança"}
          </Button>
          {links.pixUrl ? (
            <>
              <Button
                variant="secondary"
                nativeButton={false}
                render={<a href={links.pixUrl} target="_blank" rel="noopener noreferrer" />}
              >
                2 · Código Pix
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopyPix}>
                <CopyIcon /> Copiar código Pix
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Para mandar o código Pix junto, salve sua chave Pix e cidade em WhatsApp → Conexão.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { WhatsAppChargeDialog }
