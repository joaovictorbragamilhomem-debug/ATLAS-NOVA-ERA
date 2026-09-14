import { redirect } from "next/navigation"
import { getCurrentMembership } from "@/lib/auth/current-user"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionPanel } from "./_components/connection-panel"
import { TemplatesPanel, type TemplateRow } from "./_components/templates-panel"
import { RulesPanel, type AutomationRuleRow } from "./_components/rules-panel"
import { MessagesPanel } from "./_components/messages-panel"
import { getMessageQueue } from "@/lib/whatsapp/get-message-queue"

export default async function WhatsAppPage() {
  const membership = await getCurrentMembership()
  if (!membership) redirect("/app/entrar")

  const supabase = await getSupabaseServerClient()

  const [{ data: organization }, { data: connection }, { data: templates }, { data: rules }, messages] = await Promise.all([
    supabase.from("organizations").select("pix_key").eq("id", membership.organizationId).maybeSingle(),
    supabase
      .from("whatsapp_connections")
      .select("status, phone_number")
      .eq("organization_id", membership.organizationId)
      .maybeSingle(),
    supabase
      .from("message_templates")
      .select("id, name, body, active, meta_template_name, meta_template_language")
      .eq("organization_id", membership.organizationId)
      .order("name"),
    supabase
      .from("automation_rules")
      .select("id, trigger_type, days_offset, active, send_window_start, send_window_end, skip_sunday, template_id, message_templates(name)")
      .eq("organization_id", membership.organizationId)
      .order("trigger_type"),
    getMessageQueue(membership.organizationId),
  ])

  const templateRows: TemplateRow[] = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    active: t.active,
    metaTemplateName: t.meta_template_name,
    metaTemplateLanguage: t.meta_template_language,
  }))

  const ruleRows: AutomationRuleRow[] = (rules ?? []).map((r) => {
    const template = Array.isArray(r.message_templates) ? r.message_templates[0] : r.message_templates
    return {
      id: r.id,
      triggerType: r.trigger_type,
      daysOffset: r.days_offset,
      active: r.active,
      sendWindowStart: r.send_window_start,
      sendWindowEnd: r.send_window_end,
      skipSunday: r.skip_sunday,
      templateId: r.template_id,
      templateName: template?.name ?? "—",
    }
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">WhatsApp</h1>

      <Tabs defaultValue="conexao">
        <TabsList>
          <TabsTrigger value="conexao">Conexão</TabsTrigger>
          <TabsTrigger value="modelos">Modelos de mensagem</TabsTrigger>
          <TabsTrigger value="regras">Cobrança automática</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="conexao" className="pt-4">
          <ConnectionPanel
            connected={connection?.status === "connected"}
            phoneNumber={connection?.phone_number ?? null}
            pixKey={organization?.pix_key ?? null}
            canEdit={membership.role === "owner"}
          />
        </TabsContent>

        <TabsContent value="modelos" className="pt-4">
          <TemplatesPanel templates={templateRows} canEdit={membership.role !== "operator"} />
        </TabsContent>

        <TabsContent value="regras" className="pt-4">
          <RulesPanel rules={ruleRows} templates={templateRows} canEdit={membership.role !== "operator"} />
        </TabsContent>

        <TabsContent value="mensagens" className="pt-4">
          <MessagesPanel messages={messages} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
