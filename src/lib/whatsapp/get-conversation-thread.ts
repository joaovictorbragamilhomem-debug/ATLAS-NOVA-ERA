import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ThreadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  occurredAt: string;
};

export async function getConversationThread(organizationId: string, customerId: string): Promise<ThreadMessage[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("whatsapp_messages")
    .select("id, direction, body, occurred_at")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .order("occurred_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    direction: row.direction as "inbound" | "outbound",
    body: row.body,
    occurredAt: row.occurred_at,
  }));
}

// Último "inbound" da conversa — é o que define a janela de 24h em que
// ainda dá pra mandar texto livre (ver src/lib/whatsapp/reply-window.ts).
export function getLastInboundAt(messages: ThreadMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].direction === "inbound") return messages[i].occurredAt;
  }
  return null;
}
