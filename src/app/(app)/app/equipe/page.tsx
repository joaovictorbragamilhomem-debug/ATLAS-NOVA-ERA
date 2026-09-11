import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getTeamMembers } from "@/lib/team/get-team-members"
import { TeamManager } from "./_components/team-manager"

export default async function EquipePage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const members = await getTeamMembers(membership.organizationId)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Dono: tudo, inclusive assinatura e WhatsApp. Gestor: também renegocia e estorna. Operador:
          clientes, fichas, conversas e baixa de pagamento.
        </p>
      </div>

      <TeamManager
        members={members}
        canInvite={membership.role === "owner" || membership.role === "manager"}
        isOwner={membership.role === "owner"}
      />
    </main>
  )
}
