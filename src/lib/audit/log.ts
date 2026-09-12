import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Toda criação, edição, baixa, estorno e cancelamento importante grava
// quem, quando, e o estado antes/depois — nunca é apagado.
export async function logAudit(params: {
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  await admin.from("audit_logs").insert({
    organization_id: params.organizationId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    before: params.before ?? null,
    after: params.after ?? null,
  });
}
