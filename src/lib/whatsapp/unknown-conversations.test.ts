import { describe, expect, it } from "vitest";
import { groupUnknownMessages, suggestWhatsappDigits } from "./unknown-conversations";

describe("groupUnknownMessages", () => {
  it("returns nothing for no messages", () => {
    expect(groupUnknownMessages([])).toEqual([]);
  });

  it("groups by number, keeping the newest message and counting the rest", () => {
    const groups = groupUnknownMessages([
      { customer_phone_digits: "9491703949", body: "newest", occurred_at: "2026-09-21T19:15:41Z" },
      { customer_phone_digits: "1198887777", body: "other person", occurred_at: "2026-09-20T10:00:00Z" },
      { customer_phone_digits: "9491703949", body: "older", occurred_at: "2026-09-15T11:11:01Z" },
    ]);
    expect(groups).toEqual([
      { phoneDigits: "9491703949", lastMessageBody: "newest", lastMessageAt: "2026-09-21T19:15:41Z", messageCount: 2 },
      { phoneDigits: "1198887777", lastMessageBody: "other person", lastMessageAt: "2026-09-20T10:00:00Z", messageCount: 1 },
    ]);
  });

  it("merges the same person arriving with and without the ninth digit", () => {
    const groups = groupUnknownMessages([
      { customer_phone_digits: "94991703949", body: "with nine", occurred_at: "2026-09-21T19:15:41Z" },
      { customer_phone_digits: "9491703949", body: "without nine", occurred_at: "2026-09-15T11:11:01Z" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].messageCount).toBe(2);
    expect(groups[0].phoneDigits).toBe("94991703949");
  });
});

describe("suggestWhatsappDigits", () => {
  it("adds the ninth digit to an old-format mobile", () => {
    expect(suggestWhatsappDigits("9491703949")).toBe("94991703949");
  });

  it("leaves numbers that already have 11 digits untouched", () => {
    expect(suggestWhatsappDigits("94991703949")).toBe("94991703949");
  });

  it("leaves landline-looking numbers untouched", () => {
    expect(suggestWhatsappDigits("9433221100")).toBe("9433221100");
  });
});
