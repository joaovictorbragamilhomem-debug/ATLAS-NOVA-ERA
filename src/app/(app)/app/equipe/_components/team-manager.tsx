"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  changeTeamMemberRoleAction,
  type TeamActionState,
} from "@/lib/team/actions"
import type { TeamMember } from "@/lib/team/get-team-members"

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  owner: "Dono",
  manager: "Gestor",
  operator: "Operador",
}

const STATUS_LABEL: Record<TeamMember["status"], string> = {
  active: "Ativo",
  invited: "Convite pendente",
  removed: "Removido",
}

const initialInviteState: TeamActionState = { error: null }

function InviteForm() {
  const [state, action, pending] = useActionState(inviteTeamMemberAction, initialInviteState)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="invite-email">E-mail</Label>
        <Input id="invite-email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Papel</Label>
        <Select name="role" defaultValue="operator">
          <SelectTrigger id="invite-role" className="w-full sm:w-40">
            {/* Sem isso, o gatilho mostra o valor cru ("operator") em vez do
            rótulo em português — SelectValue não lê os children de SelectItem
            sozinho, precisa de uma função de formatação. */}
            <SelectValue>{(value: string) => ROLE_LABEL[value as TeamMember["role"]]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">Gestor</SelectItem>
            <SelectItem value="operator">Operador</SelectItem>
            <SelectItem value="owner">Dono</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" loading={pending}>
        Convidar
      </Button>
      <FormError message={state.error} className="sm:basis-full" />
    </form>
  )
}

function MemberRow({ member, canManage, isOwner }: { member: TeamMember; canManage: boolean; isOwner: boolean }) {
  const [busy, setBusy] = React.useState(false)

  async function handleRoleChange(role: TeamMember["role"]) {
    setBusy(true)
    const result = await changeTeamMemberRoleAction(member.id, role)
    setBusy(false)
    if (result.error) toast.error(result.error)
  }

  async function handleRemove() {
    setBusy(true)
    const result = await removeTeamMemberAction(member.id)
    setBusy(false)
    if (result.error) toast.error(result.error)
    else toast.success("Removido da equipe.")
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{member.email}</span>
        <span className="text-xs text-muted-foreground">{STATUS_LABEL[member.status]}</span>
      </div>
      <div className="flex items-center gap-2">
        {canManage ? (
          <Select value={member.role} onValueChange={(v) => handleRoleChange(v as TeamMember["role"])} disabled={busy}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue>{(value: string) => ROLE_LABEL[value as TeamMember["role"]]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Gestor</SelectItem>
              <SelectItem value="operator">Operador</SelectItem>
              <SelectItem value="owner">Dono</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">{ROLE_LABEL[member.role]}</span>
        )}
        {isOwner && (
          <Button variant="destructive" size="sm" loading={busy} onClick={handleRemove}>
            Remover
          </Button>
        )}
      </div>
    </div>
  )
}

function TeamManager({
  members,
  canInvite,
  isOwner,
}: {
  members: TeamMember[]
  canInvite: boolean
  isOwner: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {canInvite && <InviteForm />}
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} canManage={canInvite} isOwner={isOwner} />
        ))}
      </div>
    </div>
  )
}

export { TeamManager }
