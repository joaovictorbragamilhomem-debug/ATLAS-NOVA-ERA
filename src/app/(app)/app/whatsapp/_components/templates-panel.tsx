"use client"

import * as React from "react"
import { toast } from "sonner"
import { PlusIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { KNOWN_TEMPLATE_VARIABLES } from "@/lib/message-template"
import {
  createMessageTemplateAction,
  updateMessageTemplateAction,
  deleteMessageTemplateAction,
  toggleMessageTemplateActiveAction,
  type TemplateActionState,
} from "@/lib/whatsapp/template-actions"

export type TemplateRow = {
  id: string
  name: string
  body: string
  active: boolean
  metaTemplateName: string | null
  metaTemplateLanguage: string
}

const initialState: TemplateActionState = { error: null }

function TemplateFormFields({ defaultValues }: { defaultValues?: TemplateRow }) {
  const [body, setBody] = React.useState(defaultValues?.body ?? "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome interno</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} placeholder="Lembrete 3 dias antes" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Texto (use as variáveis abaixo)</Label>
        <Textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
        <div className="flex flex-wrap gap-1.5">
          {KNOWN_TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setBody((b) => `${b}{{${v}}}`)}
              className="rounded-4xl border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metaTemplateName">Nome do modelo aprovado na Meta</Label>
        <Input
          id="metaTemplateName"
          name="metaTemplateName"
          defaultValue={defaultValues?.metaTemplateName ?? ""}
          placeholder="lembrete_vencimento"
        />
        <p className="text-xs text-muted-foreground">
          A Meta só manda mensagem por iniciativa da empresa se for um modelo com esse exato nome, já aprovado no
          Gerenciador do WhatsApp Business — com as mesmas variáveis, na mesma ordem.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metaTemplateLanguage">Idioma do modelo na Meta</Label>
        <Input
          id="metaTemplateLanguage"
          name="metaTemplateLanguage"
          defaultValue={defaultValues?.metaTemplateLanguage ?? "pt_BR"}
        />
      </div>
    </div>
  )
}

function NewTemplateDialog() {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await createMessageTemplateAction(initialState, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    toast.success("Modelo criado.")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon /> Novo modelo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo modelo de mensagem</DialogTitle>
          <DialogDescription>Salvo só na ATLAS — o envio de verdade também depende do modelo aprovado na Meta.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <TemplateFormFields />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" loading={pending}>
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditTemplateDialog({ template }: { template: TemplateRow }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await updateMessageTemplateAction(template.id, { error: null }, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    toast.success("Modelo salvo.")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary" />}>Editar</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar modelo</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <TemplateFormFields defaultValues={template} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" loading={pending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TemplateItem({ template, canEdit }: { template: TemplateRow; canEdit: boolean }) {
  const [busy, setBusy] = React.useState(false)
  const [deleted, setDeleted] = React.useState(false)

  async function handleToggle(active: boolean) {
    setBusy(true)
    const result = await toggleMessageTemplateActiveAction(template.id, active)
    setBusy(false)
    if (result.error) toast.error(result.error)
  }

  async function handleDelete() {
    setBusy(true)
    const result = await deleteMessageTemplateAction(template.id)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDeleted(true)
  }

  if (deleted) return null

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{template.name}</p>
          <p className="text-xs text-muted-foreground">{template.body}</p>
          {template.metaTemplateName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Modelo Meta: <code className="rounded bg-muted px-1">{template.metaTemplateName}</code>
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Switch checked={template.active} onCheckedChange={handleToggle} disabled={busy} />
          </div>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          <EditTemplateDialog template={template} />
          <Button size="sm" variant="ghost" loading={busy} onClick={handleDelete}>
            <TrashIcon /> Apagar
          </Button>
        </div>
      )}
    </li>
  )
}

function TemplatesPanel({ templates, canEdit }: { templates: TemplateRow[]; canEdit: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div className="flex justify-end">
          <NewTemplateDialog />
        </div>
      )}
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum modelo de mensagem ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {templates.map((t) => (
            <TemplateItem key={t.id} template={t} canEdit={canEdit} />
          ))}
        </ul>
      )}
    </div>
  )
}

export { TemplatesPanel }
