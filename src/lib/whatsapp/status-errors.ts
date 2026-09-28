// Shape of statuses[].errors in Meta's delivery webhook (status "failed").
export type MetaStatusError = {
  code?: number;
  title?: string;
  message?: string;
  error_data?: { details?: string };
};

// Meta can't be queried for a message's failure reason later, so this text is
// the only record of why a delivery failed. Example: "#131026 — Message
// undeliverable — Receiver is incapable of receiving this message".
export function describeStatusErrors(errors: MetaStatusError[] | undefined): string | null {
  if (!errors || errors.length === 0) return null;

  return errors
    .map((e) => {
      const parts = [e.code ? `#${e.code}` : null, e.title ?? e.message ?? null, e.error_data?.details ?? null];
      return parts.filter((p, i) => p && parts.indexOf(p) === i).join(" — ");
    })
    .filter(Boolean)
    .join("; ") || null;
}
