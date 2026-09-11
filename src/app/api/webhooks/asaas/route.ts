import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { paymentConfirmedEmail, paymentFailedEmail } from "@/lib/email/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getOwnerEmail(admin: SupabaseClient, organizationId: string): Promise<string | null> {
  const { data: owner } = await admin
    .from("memberships")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle();
  if (!owner) return null;
  const { data } = await admin.auth.admin.getUserById(owner.user_id);
  return data.user?.email ?? null;
}

// Eventos que confirmam que o dinheiro entrou.
const CONFIRMED_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
// Eventos que indicam atraso.
const OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
// Eventos que encerram a cobrança.
const CANCELED_EVENTS = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED", "SUBSCRIPTION_DELETED"]);

export async function POST(request: NextRequest) {
  const token = request.headers.get("asaas-access-token");
  if (!token || token !== process.env.ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });

  const body = await request.json();
  const eventId: string | undefined = body.id;
  const eventType: string | undefined = body.event;

  if (!eventId || !eventType) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  // Trava contra evento repetido: a chave primária de asaas_webhook_events
  // é o próprio id do evento. Se já existe, não processa de novo.
  const { error: insertError } = await admin
    .from("asaas_webhook_events")
    .insert({ id: eventId, event_type: eventType });

  if (insertError) {
    // Violação de chave primária = evento repetido, ignora silenciosamente.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const payment = body.payment;
  if (!payment) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const organizationId: string | undefined = payment.externalReference;
  if (!organizationId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id, plan")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let update: Record<string, unknown> | null = null;

  if (CONFIRMED_EVENTS.has(eventType)) {
    const isLifetime = subscription.plan === "lifetime";
    update = {
      status: isLifetime ? "lifetime" : "active",
      asaas_payment_id: payment.id,
      ...(payment.subscription ? { asaas_subscription_id: payment.subscription } : {}),
      ...(!isLifetime && payment.dueDate ? { current_period_end: payment.dueDate } : {}),
    };
  } else if (OVERDUE_EVENTS.has(eventType)) {
    update = { status: "past_due" };
  } else if (CANCELED_EVENTS.has(eventType)) {
    update = { status: "canceled", canceled_at: new Date().toISOString() };
  }

  if (update) {
    await admin.from("subscriptions").update(update).eq("id", subscription.id);

    const ownerEmail = await getOwnerEmail(admin, organizationId);
    if (ownerEmail) {
      if (CONFIRMED_EVENTS.has(eventType)) {
        const { subject, html } = paymentConfirmedEmail();
        await sendEmail({ to: ownerEmail, subject, html });
      } else if (OVERDUE_EVENTS.has(eventType)) {
        const { subject, html } = paymentFailedEmail();
        await sendEmail({ to: ownerEmail, subject, html });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
