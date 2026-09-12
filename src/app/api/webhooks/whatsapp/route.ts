import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  const payload = JSON.parse(rawBody);
  const statuses: MetaStatusEntry[] =
    payload?.entry?.flatMap(
      (entry: { changes?: { value?: { statuses?: MetaStatusEntry[] } }[] }) =>
        entry.changes?.flatMap((change) => change.value?.statuses ?? []) ?? []
    ) ?? [];

  for (const statusUpdate of statuses) {
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

  return NextResponse.json({ ok: true });
}
