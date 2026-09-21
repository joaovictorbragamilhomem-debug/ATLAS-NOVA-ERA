import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeForMatch } from "./phone-match";
import { matchOrphansToCustomers } from "./match-orphan-messages";

const MAX_ORPHANS = 300;
const MAX_DISTINCT_NUMBERS = 50;

// Messages are immutable for members (no UPDATE policy), and a message that
// arrived before its sender became a customer is stored with customer_id null.
// This server-side step links those messages once the customer exists, however
// the customer was created (form, import or an edited number). It only touches
// rows of this organization that are still unlinked, and it never throws:
// failing to link must not break the inbox.
export async function linkOrphanMessages(organizationId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  try {
    const { data: orphans } = await admin
      .from("whatsapp_messages")
      .select("id, customer_phone_digits")
      .eq("organization_id", organizationId)
      .is("customer_id", null)
      .limit(MAX_ORPHANS);
    if (!orphans || orphans.length === 0) return;

    const suffixes = [...new Set(orphans.map((o) => normalizeForMatch(o.customer_phone_digits).slice(-8)))].slice(
      0,
      MAX_DISTINCT_NUMBERS
    );

    const { data: candidates } = await admin
      .from("customers")
      .select("id, whatsapp")
      .eq("organization_id", organizationId)
      .or(suffixes.map((suffix) => `whatsapp.like.*${suffix}`).join(","));
    if (!candidates || candidates.length === 0) return;

    for (const [customerId, messageIds] of matchOrphansToCustomers(orphans, candidates)) {
      await admin
        .from("whatsapp_messages")
        .update({ customer_id: customerId })
        .in("id", messageIds)
        .eq("organization_id", organizationId)
        .is("customer_id", null);
    }
  } catch (error) {
    console.error("linkOrphanMessages failed", error);
  }
}
