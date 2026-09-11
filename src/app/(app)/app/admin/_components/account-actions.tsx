"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { extendTrialAction, grantPlanAction } from "@/lib/admin/actions"

function AccountActions({ organizationId }: { organizationId: string }) {
  const [busy, setBusy] = React.useState(false)

  async function handleExtend() {
    setBusy(true)
    const result = await extendTrialAction(organizationId, 7)
    setBusy(false)
    if (result.error) toast.error(result.error)
    else toast.success("Teste estendido por mais 7 dias.")
  }

  async function handleGrant(plan: "monthly" | "annual" | "lifetime") {
    setBusy(true)
    const result = await grantPlanAction(organizationId, plan)
    setBusy(false)
    if (result.error) toast.error(result.error)
    else toast.success("Plano concedido.")
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" loading={busy} onClick={handleExtend}>
        +7 dias de teste
      </Button>
      <Button variant="secondary" size="sm" loading={busy} onClick={() => handleGrant("monthly")}>
        Conceder Mensal
      </Button>
      <Button variant="secondary" size="sm" loading={busy} onClick={() => handleGrant("lifetime")}>
        Conceder Vitalício
      </Button>
    </div>
  )
}

export { AccountActions }
