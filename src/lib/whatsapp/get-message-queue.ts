import { getSupabaseServerClient } from "@/lib/supabase/server";

export type MessageQueueRow = {
  id: string;
  customerName: string;
  contractId: string | null;
  triggerType: string;
  scheduledFor: string;
  status: string;
  attempts: number;
  lastError: string | null;
  renderedBody: string;
};

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getMessageQueue(organizationId: string, limit = 50): Promise<MessageQueueRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("message_queue")
    .select("id, contract_id, trigger_type, scheduled_for, status, attempts, last_error, rendered_body, customers(name)")
    .eq("organization_id", organizationId)
    .order("scheduled_for", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const customer = unwrap(row.customers);
    return {
      id: row.id,
      customerName: customer?.name ?? "—",
      contractId: row.contract_id,
      triggerType: row.trigger_type,
      scheduledFor: row.scheduled_for,
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
      renderedBody: row.rendered_body,
    };
  });
}
