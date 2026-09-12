"use client"

import * as React from "react"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateIntakeSlugAction } from "@/lib/intake/actions"

function IntakeSlugForm({
  currentSlug,
  siteUrl,
  canEdit,
}: {
  currentSlug: string | null
  siteUrl: string
  canEdit: boolean
}) {
  const [editing, setEditing] = React.useState(!currentSlug)
  const [slugInput, setSlugInput] = React.useState(currentSlug ?? "")
  const [pending, setPending] = React.useState(false)

  const publicUrl = currentSlug ? `${siteUrl}/c/${currentSlug}` : null

  async function copyLink() {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    toast.success("Link copiado.")
  }

  async function handleSave() {
    setPending(true)
    const result = await updateIntakeSlugAction(slugInput)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Link salvo.")
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Link para novos clientes se cadastrarem</p>
        <p className="text-xs text-muted-foreground">
          Mande esse link pelo WhatsApp — a pessoa preenche os próprios dados e você só aprova.
        </p>
      </div>

      {!editing && publicUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-muted px-2 py-1 text-sm">{publicUrl}</code>
          <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
            <CopyIcon /> Copiar
          </Button>
          {canEdit && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      ) : (
        canEdit && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">{siteUrl}/c/</Label>
              <Input
                id="slug"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="minha-empresa"
              />
            </div>
            <Button type="button" size="sm" loading={pending} onClick={handleSave}>
              Salvar
            </Button>
            {currentSlug && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
        )
      )}
    </div>
  )
}

export { IntakeSlugForm }
