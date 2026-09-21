import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchesWhatsAppNumber } from "@/lib/whatsapp/phone-match";
import { pickConnectionOwner } from "@/lib/whatsapp/pick-connection-owner";
import { onlyDigits } from "@/lib/masks";

// Handshake de verificação que a Meta faz uma vez, ao configurar o webhook
// no painel de desenvolvedor.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

type MetaStatusEntry = { id: string; status: string };
type MetaInboundMessage = { id: string; from: string; timestamp: string; type: string; text?: { body: string } };
type MetaChange = {
  value?: {
    metadata?: { phone_number_id?: string };
    statuses?: MetaStatusEntry[];
    messages?: MetaInboundMessage[];
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  const payload = JSON.parse(rawBody);
  const changes: MetaChange[] =
    payload?.entry?.flatMap((entry: { changes?: MetaChange[] }) => entry.changes ?? []) ?? [];

  for (const change of changes) {
    for (const statusUpdate of change.value?.statuses ?? []) {
      // status: "sent" | "delivered" | "read" | "failed"
      const { data: log } = await admin
        .from("message_logs")
        .select("queue_id, organization_id")
        .eq("provider_message_id", statusUpdate.id)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!log) continue;

      await admin.from("message_queue").update({ status: statusUpdate.status }).eq("id", log.queue_id);
      await admin.from("message_logs").insert({
        organization_id: log.organization_id,
        queue_id: log.queue_id,
        status: statusUpdate.status,
        provider_message_id: statusUpdate.id,
      });
    }
  }

  // Mensagens que o cliente mandou (Central de conversas) — separado do
  // loop de status acima porque cada uma precisa achar a organização dona
  // do número que recebeu (via phone_number_id), não de uma mensagem
  // enfileirada por nós.
  const orgIdByPhoneNumberId = new Map<string, string | null>();
  const customersByOrg = new Map<string, { id: string; whatsapp: string }[]>();

  for (const change of changes) {
    const phoneNumberId = change.value?.metadata?.phone_number_id;
    const messages = change.value?.messages ?? [];
    if (!phoneNumberId || messages.length === 0) continue;

    if (!orgIdByPhoneNumberId.has(phoneNumberId)) {
      const { data: connections } = await admin
        .from("whatsapp_connections")
        .select("organization_id, status")
        .eq("provider_account_id", phoneNumberId);
      orgIdByPhoneNumberId.set(phoneNumberId, pickConnectionOwner(connections));
    }
    const organizationId = orgIdByPhoneNumberId.get(phoneNumberId);
    if (!organizationId) continue;

    if (!customersByOrg.has(organizationId)) {
      const { data: customers } = await admin
        .from("customers")
        .select("id, whatsapp")
        .eq("organization_id", organizationId);
      customersByOrg.set(organizationId, customers ?? []);
    }
    const customers = customersByOrg.get(organizationId) ?? [];

    for (const message of messages) {
      const customer = customers.find((c) => matchesWhatsAppNumber(c.whatsapp, message.from));
      const body =
        message.type === "text" && message.text
          ? message.text.body
          : `[mensagem tipo ${message.type} — abra no WhatsApp Business]`;

      // upsert + ignoreDuplicates: a Meta reenvia entrega de webhook; a
      // trava única em provider_message_id vira um no-op em vez de erro.
      await admin.from("whatsapp_messages").upsert(
        {
          organization_id: organizationId,
          customer_id: customer?.id ?? null,
          direction: "inbound",
          body,
          customer_phone_digits: onlyDigits(message.from).replace(/^55/, ""),
          provider_message_id: message.id,
          occurred_at: new Date(Number(message.timestamp) * 1000).toISOString(),
        },
        { onConflict: "provider_message_id", ignoreDuplicates: true }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
