import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { scanAndEnqueueDueInstallmentMessages } from "@/lib/whatsapp/scan-due-installments";
import { sendQueuedMessages } from "@/lib/whatsapp/send-queued-messages";

function isAuthorizedCronRequest(authHeader: string | null): boolean {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(authHeader);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

// Uma rota só, chamada uma vez por dia pelo Vercel Cron (o plano Hobby não
// permite agendamentos mais frequentes) — primeiro enfileira o que vence
// hoje, depois manda o que já está na fila e cabe na janela de horário.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!isAuthorizedCronRequest(authHeader)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scanResult = await scanAndEnqueueDueInstallmentMessages();
  const sendResult = await sendQueuedMessages();

  return NextResponse.json({ ...scanResult, ...sendResult });
}
