import { matchesWhatsAppNumber } from "./phone-match";

export type OrphanMessage = { id: string; customer_phone_digits: string };
export type CustomerPhone = { id: string; whatsapp: string };

// Which customer each orphan message belongs to, as customerId -> message ids.
// Uses the same matching rule as the webhook (first matching customer wins),
// so a message is linked exactly as it would have been had the customer
// existed when it arrived. "55" is re-added because the stored digits omit it.
export function matchOrphansToCustomers(orphans: OrphanMessage[], customers: CustomerPhone[]): Map<string, string[]> {
  const byCustomer = new Map<string, string[]>();

  for (const orphan of orphans) {
    const customer = customers.find((c) => matchesWhatsAppNumber(c.whatsapp, `55${orphan.customer_phone_digits}`));
    if (!customer) continue;
    const ids = byCustomer.get(customer.id);
    if (ids) ids.push(orphan.id);
    else byCustomer.set(customer.id, [orphan.id]);
  }

  return byCustomer;
}
