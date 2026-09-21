import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildActivationFunnel, type ActivationStage } from "./build-activation-funnel";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const PAGE_SIZE = 1000;
const LOOKUP_CONCURRENCY = 25;
const IN_CHUNK_SIZE = 100;

async function inChunks<T, R>(items: T[], size: number, run: (chunk: T[]) => Promise<R[]>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await run(items.slice(i, i + size))));
  }
  return results;
}

// The API silently caps a response at 1000 rows, so paginate instead of
// trusting a single select to return every organization.
async function fetchAllOrganizationIds(admin: Admin): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    ids.push(...(data ?? []).map((row) => row.id));
    if (!data || data.length < PAGE_SIZE) return ids;
  }
}

// customers/contracts have many rows per organization, so a bulk select would
// hit the row cap and undercount. One `limit(1)` lookup per organization is
// exact and cheap thanks to the organization_id index.
async function organizationsWithAnyRow(
  admin: Admin,
  table: "customers" | "contracts",
  organizationIds: string[]
): Promise<Set<string>> {
  const hits = await inChunks(organizationIds, LOOKUP_CONCURRENCY, (chunk) =>
    Promise.all(
      chunk.map(async (organizationId) => {
        const { data, error } = await admin.from(table).select("id").eq("organization_id", organizationId).limit(1);
        if (error) throw error;
        return data && data.length > 0 ? organizationId : null;
      })
    )
  );
  return new Set(hits.filter((id): id is string => id !== null));
}

// whatsapp_connections and subscriptions have at most one row per organization,
// so filtering by chunks of ids can never reach the row cap.
async function organizationsWithConnectedWhatsapp(admin: Admin, organizationIds: string[]): Promise<Set<string>> {
  const rows = await inChunks(organizationIds, IN_CHUNK_SIZE, async (chunk) => {
    const { data, error } = await admin
      .from("whatsapp_connections")
      .select("organization_id")
      .eq("status", "connected")
      .in("organization_id", chunk);
    if (error) throw error;
    return (data ?? []).map((row) => row.organization_id as string);
  });
  return new Set(rows);
}

// Requires an Asaas id on top of an active status: accounts switched to
// "active" by hand in the admin panel (tests, courtesy) have no Asaas record
// and must not count as paying customers.
async function organizationsPaying(admin: Admin, organizationIds: string[]): Promise<Set<string>> {
  const rows = await inChunks(organizationIds, IN_CHUNK_SIZE, async (chunk) => {
    const { data, error } = await admin
      .from("subscriptions")
      .select("organization_id")
      .in("status", ["active", "lifetime"])
      .or("asaas_subscription_id.not.is.null,asaas_payment_id.not.is.null")
      .in("organization_id", chunk);
    if (error) throw error;
    return (data ?? []).map((row) => row.organization_id as string);
  });
  return new Set(rows);
}

export async function getActivationFunnel(): Promise<ActivationStage[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const organizationIds = await fetchAllOrganizationIds(admin);

  const [withCustomer, withContract, withWhatsappConnected, paying] = await Promise.all([
    organizationsWithAnyRow(admin, "customers", organizationIds),
    organizationsWithAnyRow(admin, "contracts", organizationIds),
    organizationsWithConnectedWhatsapp(admin, organizationIds),
    organizationsPaying(admin, organizationIds),
  ]);

  return buildActivationFunnel({ organizationIds, withCustomer, withContract, withWhatsappConnected, paying });
}
