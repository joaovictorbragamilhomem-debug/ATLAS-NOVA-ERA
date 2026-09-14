"use client"

import * as React from "react"
import { toast } from "sonner"
import { PlusIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  sendWindowStart: string
  sendWindowEnd: string
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

function NewRuleDialog({ templates }: { templates: TemplateRow[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [triggerType, setTriggerType] = React.useState("reminder_before")
  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "")
  const templateNameById = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await createAutomationRuleAction(initialState, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    toast.success("Regra criada.")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon /> Nova regra
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova regra de cobrança automática</DialogTitle>
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
              <Input id="daysOffset" name="daysOffset" type="number" min={1} required />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sendWindowStart">Não mandar antes de</Label>
              <Input id="sendWindowStart" name="sendWindowStart" type="time" defaultValue="08:00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sendWindowEnd">Nem depois de</Label>
              <Input id="sendWindowEnd" name="sendWindowEnd" type="time" defaultValue="20:00" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="skipSunday" defaultChecked className="size-4" />
            Não mandar aos domingos
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" loading={pending} disabled={templates.length === 0}>
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RuleItem({ rule }: { rule: AutomationRuleRow }) {
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
          Modelo: {rule.templateName} · {rule.sendWindowStart.slice(0, 5)}–{rule.sendWindowEnd.slice(0, 5)}
          {rule.skipSunday && " · sem domingo"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={rule.active} onCheckedChange={handleToggle} disabled={busy} />
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
      {canEdit && (
        <div className="flex justify-end">
          <NewRuleDialog templates={templates} />
        </div>
      )}
      {templates.length === 0 && (
        <p className="text-sm text-[#B45309]">Crie um modelo de mensagem antes de configurar as regras.</p>
      )}
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma regra configurada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((r) => (
            <RuleItem key={r.id} rule={r} />
          ))}
        </ul>
      )}
    </div>
  )
}

export { RulesPanel }
