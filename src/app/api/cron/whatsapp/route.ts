import { NextRequest, NextResponse } from "next/server";
import { scanAndEnqueueDueInstallmentMessages } from "@/lib/whatsapp/scan-due-installments";
import { sendQueuedMessages } from "@/lib/whatsapp/send-queued-messages";

// Uma rota só, chamada uma vez por dia pelo Vercel Cron (o plano Hobby não
// permite agendamentos mais frequentes) — primeiro enfileira o que vence
// hoje, depois manda o que já está na fila e cabe na janela de horário.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scanResult = await scanAndEnqueueDueInstallmentMessages();
  const sendResult = await sendQueuedMessages();

  return NextResponse.json({ ...scanResult, ...sendResult });
}
