"use client"

import * as React from "react"
import { toast } from "sonner"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  createAutomationRuleAction,
  updateAutomationRuleAction,
  toggleAutomationRuleActiveAction,
  deleteAutomationRuleAction,
  type AutomationRuleActionState,
} from "@/lib/whatsapp/automation-actions"
import type { TemplateRow } from "./templates-panel"

export type AutomationRuleRow = {
  id: string
  triggerType: string
  daysOffset: number | null
  active: boolean
  skipSunday: boolean
  templateId: string
  templateName: string
}

const TRIGGER_LABEL: Record<string, string> = {
  reminder_before: "Lembrete antes de vencer",
  due_today: "Vence hoje",
  overdue_after: "Atraso depois de",
  renegotiation_offer: "Oferta de renegociação",
  payment_confirmation: "Confirmação de pagamento",
  contract_created: "Contrato criado",
}

const TRIGGERS_WITH_DAYS = new Set(["reminder_before", "overdue_after", "renegotiation_offer"])

const initialState: AutomationRuleActionState = { error: null }

function RuleDialog({ templates, rule }: { templates: TemplateRow[]; rule?: AutomationRuleRow }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [triggerType, setTriggerType] = React.useState(rule?.triggerType ?? "reminder_before")
  const [templateId, setTemplateId] = React.useState(rule?.templateId ?? templates[0]?.id ?? "")
  const templateNameById = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  function handleOpenChange(next: boolean) {
    if (next) {
      setTriggerType(rule?.triggerType ?? "reminder_before")
      setTemplateId(rule?.templateId ?? templates[0]?.id ?? "")
      setError(null)
    }
    setOpen(next)
  }

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = rule
      ? await updateAutomationRuleAction(rule.id, initialState, formData)
      : await createAutomationRuleAction(initialState, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    toast.success(rule ? "Regra salva." : "Regra criada.")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {rule ? (
        <DialogTrigger render={<Button size="sm" variant="ghost" aria-label="Editar regra" />}>
          <PencilIcon />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" className="shrink-0" />}>
          <PlusIcon /> Nova regra
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar regra de cobrança automática" : "Nova regra de cobrança automática"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="triggerType">Gatilho</Label>
            <Select name="triggerType" value={triggerType} onValueChange={(v) => setTriggerType(v ?? "reminder_before")}>
              <SelectTrigger id="triggerType" className="w-full">
                <SelectValue>{(v: string) => TRIGGER_LABEL[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {TRIGGERS_WITH_DAYS.has(triggerType) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="daysOffset">Quantos dias</Label>
              <Input
                id="daysOffset"
                name="daysOffset"
                type="number"
                min={1}
                defaultValue={rule?.daysOffset ?? undefined}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="templateId">Modelo de mensagem</Label>
            <Select name="templateId" value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger id="templateId" className="w-full">
                <SelectValue placeholder="Escolha um modelo">
                  {(v: string) => templateNameById[v] ?? "Escolha um modelo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="skipSunday" defaultChecked={rule?.skipSunday ?? true} className="size-4" />
            Não mandar aos domingos (sai na segunda)
          </label>

          <FormError message={error} />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" loading={pending} disabled={templates.length === 0}>
              {rule ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RuleItem({ rule, templates, canEdit }: { rule: AutomationRuleRow; templates: TemplateRow[]; canEdit: boolean }) {
  const [busy, setBusy] = React.useState(false)
  const [deleted, setDeleted] = React.useState(false)

  async function handleToggle(active: boolean) {
    setBusy(true)
    const result = await toggleAutomationRuleActiveAction(rule.id, active)
    setBusy(false)
    if (result.error) toast.error(result.error)
  }

  async function handleDelete() {
    setBusy(true)
    const result = await deleteAutomationRuleAction(rule.id)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDeleted(true)
  }

  if (deleted) return null

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div>
        <p className="text-sm font-medium">
          {TRIGGER_LABEL[rule.triggerType]}
          {rule.daysOffset !== null && ` — ${rule.daysOffset} dia(s)`}
        </p>
        <p className="text-xs text-muted-foreground">
          Modelo: {rule.templateName}
          {rule.skipSunday && " · sem domingo"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={rule.active} onCheckedChange={handleToggle} disabled={busy} />
        {canEdit && <RuleDialog templates={templates} rule={rule} />}
        <Button size="sm" variant="ghost" loading={busy} onClick={handleDelete}>
          <TrashIcon />
        </Button>
      </div>
    </li>
  )
}

function RulesPanel({
  rules,
  templates,
  canEdit,
}: {
  rules: AutomationRuleRow[]
  templates: TemplateRow[]
  canEdit: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          As mensagens automáticas saem uma vez por dia, entre 9h e 10h (horário de Brasília).
        </p>
        {canEdit && <RuleDialog templates={templates} />}
      </div>
      {templates.length === 0 && (
        <p className="text-sm text-warning">Crie um modelo de mensagem antes de configurar as regras.</p>
      )}
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma regra configurada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((r) => (
            <RuleItem key={r.id} rule={r} templates={templates} canEdit={canEdit} />
          ))}
        </ul>
      )}
    </div>
  )
}

export { RulesPanel }
