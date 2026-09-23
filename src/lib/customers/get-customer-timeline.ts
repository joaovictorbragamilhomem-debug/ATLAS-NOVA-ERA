import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TimelineMessageEvent = {
  type: "message";
  id: string;
  occurredAt: string;
  direction: "inbound" | "outbound";
  body: string;
};

export type TimelinePaymentEvent = {
  type: "payment";
  id: string;
  occurredAt: string;
  amountCents: number;
  method: "pix" | "dinheiro" | "transferencia" | "cartao";
  installmentNumber: number;
  reversed: boolean;
  reversedReason: string | null;
};

export type TimelineEvent = TimelineMessageEvent | TimelinePaymentEvent;

const EVENTS_PER_SOURCE = 50;
const MAX_EVENTS = 30;

// Mistura mensagens de WhatsApp e pagamentos (incluindo estornos) num só
// histórico, do mais recente pro mais antigo — dá pra ver o que foi dito e
// o que foi pago sem alternar entre Conversas e o contrato.
export async function getCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
  const supabase = await getSupabaseServerClient();

  const [{ data: contracts }, { data: messages }] = await Promise.all([
    supabase.from("contracts").select("id").eq("customer_id", customerId),
    supabase
      .from("whatsapp_messages")
      .select("id, direction, body, occurred_at")
      .eq("customer_id", customerId)
      .order("occurred_at", { ascending: false })
      .limit(EVENTS_PER_SOURCE),
  ]);

  const contractIds = (contracts ?? []).map((c) => c.id);
  const { data: installments } =
    contractIds.length > 0
      ? await supabase.from("installments").select("id, number").in("contract_id", contractIds)
      : { data: [] };

  const installmentIds = (installments ?? []).map((i) => i.id);
  const installmentNumberById = new Map((installments ?? []).map((i) => [i.id, i.number]));

  const { data: payments } =
    installmentIds.length > 0
      ? await supabase
          .from("payments")
          .select("id, installment_id, amount_cents, method, paid_at, reversed_at, reversed_reason")
          .in("installment_id", installmentIds)
          .order("paid_at", { ascending: false })
          .limit(EVENTS_PER_SOURCE)
      : { data: [] };

  const events: TimelineEvent[] = [
    ...(messages ?? []).map(
      (m): TimelineMessageEvent => ({
        type: "message",
        id: m.id,
        occurredAt: m.occurred_at,
        direction: m.direction as "inbound" | "outbound",
        body: m.body,
      })
    ),
    ...(payments ?? []).map(
      (p): TimelinePaymentEvent => ({
        type: "payment",
        id: p.id,
        occurredAt: p.paid_at,
        amountCents: p.amount_cents,
        method: p.method as TimelinePaymentEvent["method"],
        installmentNumber: installmentNumberById.get(p.installment_id) ?? 0,
        reversed: p.reversed_at !== null,
        reversedReason: p.reversed_reason,
      })
    ),
  ];

  events.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));

  return events.slice(0, MAX_EVENTS);
}
