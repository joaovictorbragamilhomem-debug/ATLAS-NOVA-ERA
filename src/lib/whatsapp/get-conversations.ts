import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ConversationRow = {
  customerId: string;
  customerName: string;
  lastMessageBody: string;
  lastMessageDirection: "inbound" | "outbound";
  lastMessageAt: string;
};

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// "Conversa" não é uma tabela própria — é só a mensagem mais recente de
// cada cliente que já trocou mensagem. Só entram aqui mensagens já
// casadas com um cliente cadastrado (customer_id preenchido); mensagem de
// número desconhecido fica guardada, mas não aparece na caixa de entrada.
export async function getConversations(organizationId: string, limit = 300): Promise<ConversationRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("whatsapp_messages")
    .select("customer_id, body, direction, occurred_at, customers(name)")
    .eq("organization_id", organizationId)
    .not("customer_id", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  const byCustomer = new Map<string, ConversationRow>();
  for (const row of data ?? []) {
    if (!row.customer_id || byCustomer.has(row.customer_id)) continue;
    const customer = unwrap(row.customers);
    byCustomer.set(row.customer_id, {
      customerId: row.customer_id,
      customerName: customer?.name ?? "—",
      lastMessageBody: row.body,
      lastMessageDirection: row.direction as "inbound" | "outbound",
      lastMessageAt: row.occurred_at,
    });
  }

  return Array.from(byCustomer.values());
}
