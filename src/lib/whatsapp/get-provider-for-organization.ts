import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/whatsapp/token-crypto";
import { createMetaCloudApiProvider } from "@/lib/whatsapp/meta-cloud-api-provider";
import type { WhatsAppProvider } from "@/lib/whatsapp/provider";

export async function getProviderForOrganization(
  organizationId: string
): Promise<{ provider: WhatsAppProvider; phoneNumber: string | null } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: connection } = await admin
    .from("whatsapp_connections")
    .select("provider, status, phone_number, provider_account_id, credentials_ref")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!connection || connection.status !== "connected" || !connection.credentials_ref || !connection.provider_account_id) {
    return null;
  }

  if (connection.provider === "meta_cloud_api") {
    const accessToken = decryptToken(connection.credentials_ref);
    return {
      provider: createMetaCloudApiProvider({ phoneNumberId: connection.provider_account_id, accessToken }),
      phoneNumber: connection.phone_number,
    };
  }

  return null;
}
