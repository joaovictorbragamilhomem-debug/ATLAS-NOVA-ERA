"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { encryptToken } from "@/lib/whatsapp/token-crypto";

export type ConnectWhatsAppState = { error: string | null };

const META_GRAPH_API_VERSION = "v21.0";

async function verifyMetaCredentials(
  phoneNumberId: string,
  accessToken: string
): Promise<{ ok: true; displayPhoneNumber: string } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${phoneNumberId}?fields=verified_name,display_phone_number`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch {
    return { ok: false, error: "Não foi possível conectar com a Meta. Confira sua internet e tente de novo." };
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: data?.error?.message ?? "Não foi possível verificar essas credenciais." };
  }
  if (!data?.display_phone_number) {
    return { ok: false, error: "Resposta inesperada da Meta ao verificar as credenciais." };
  }

  return { ok: true, displayPhoneNumber: data.display_phone_number };
}

export async function connectWhatsAppAction(
  _prev: ConnectWhatsAppState,
  formData: FormData
): Promise<ConnectWhatsAppState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role !== "owner") return { error: "Só o Dono pode conectar o WhatsApp." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();

  if (!phoneNumberId) return { error: "Informe o ID do número de telefone." };
  if (!accessToken) return { error: "Informe o token de acesso." };

  const verification = await verifyMetaCredentials(phoneNumberId, accessToken);
  if (!verification.ok) return { error: verification.error };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("whatsapp_connections").upsert(
    {
      organization_id: membership.organizationId,
      provider: "meta_cloud_api",
      status: "connected",
      phone_number: verification.displayPhoneNumber,
      provider_account_id: phoneNumberId,
      credentials_ref: encryptToken(accessToken),
      connected_at: new Date().toISOString(),
      last_error: null,
    },
    { onConflict: "organization_id" }
  );

  if (error) return { error: "Não foi possível salvar a conexão." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "whatsapp_connection.connected",
    entityType: "whatsapp_connection",
    entityId: null,
    after: { phone_number: verification.displayPhoneNumber },
  });

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function disconnectWhatsAppAction(): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role !== "owner") return { error: "Só o Dono pode desconectar o WhatsApp." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("whatsapp_connections")
    .update({ status: "disconnected", credentials_ref: null, connected_at: null })
    .eq("organization_id", membership.organizationId);

  if (error) return { error: "Não foi possível desconectar." };

  await logAudit({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "whatsapp_connection.disconnected",
    entityType: "whatsapp_connection",
    entityId: null,
  });

  revalidatePath("/app/whatsapp");
  return { error: null };
}

export async function updatePixKeyAction(pixKey: string): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role !== "owner") return { error: "Só o Dono pode alterar a chave Pix." };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("organizations")
    .update({ pix_key: pixKey.trim() || null })
    .eq("id", membership.organizationId);

  if (error) return { error: "Não foi possível salvar a chave Pix." };

  revalidatePath("/app/whatsapp");
  return { error: null };
}
