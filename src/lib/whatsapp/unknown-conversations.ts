import { normalizeForMatch } from "./phone-match";

export type UnknownMessageRow = {
  customer_phone_digits: string;
  body: string;
  occurred_at: string;
};

export type UnknownConversationRow = {
  // DDD + number as Meta sent it (often without the ninth digit).
  phoneDigits: string;
  lastMessageBody: string;
  lastMessageAt: string;
  messageCount: number;
};

// `rows` must be ordered newest first. The same person can arrive with and
// without the ninth digit, so group by the same key used to match customers.
export function groupUnknownMessages(rows: UnknownMessageRow[]): UnknownConversationRow[] {
  const groups = new Map<string, UnknownConversationRow>();

  for (const row of rows) {
    const key = normalizeForMatch(row.customer_phone_digits);
    const existing = groups.get(key);
    if (existing) {
      existing.messageCount += 1;
      continue;
    }
    groups.set(key, {
      phoneDigits: row.customer_phone_digits,
      lastMessageBody: row.body,
      lastMessageAt: row.occurred_at,
      messageCount: 1,
    });
  }

  return Array.from(groups.values());
}

// Meta often delivers Brazilian mobiles without the ninth digit. A 10-digit
// number whose local part starts with 6-9 is an old-format mobile, so add the
// 9 before pre-filling the customer form; anything else is left untouched.
export function suggestWhatsappDigits(digits: string): string {
  if (digits.length === 10 && /^[6-9]/.test(digits.slice(2))) {
    return `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return digits;
}
