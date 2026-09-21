export type ConnectionOwnerRow = { organization_id: string; status: string };

// A phone_number_id should belong to one organization, but a disconnected
// connection keeps its id, so two rows can briefly share it. Route incoming
// messages to the connected one; fall back to any row so nothing is dropped
// while an organization is disconnected.
export function pickConnectionOwner(rows: ConnectionOwnerRow[] | null | undefined): string | null {
  if (!rows || rows.length === 0) return null;
  return (rows.find((row) => row.status === "connected") ?? rows[0]).organization_id;
}
