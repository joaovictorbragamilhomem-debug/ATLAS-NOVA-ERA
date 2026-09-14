import { describe, expect, it } from "vitest";
import { isWithinReplyWindow } from "./reply-window";

describe("isWithinReplyWindow", () => {
  const now = new Date("2026-09-14T12:00:00.000Z");

  it("is true just under 24h since the last inbound message", () => {
    const lastInboundAt = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(isWithinReplyWindow(lastInboundAt, now)).toBe(true);
  });

  it("is false just over 24h since the last inbound message", () => {
    const lastInboundAt = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
    expect(isWithinReplyWindow(lastInboundAt, now)).toBe(false);
  });

  it("is false when there is no inbound history", () => {
    expect(isWithinReplyWindow(null, now)).toBe(false);
  });

  it("is false for a timestamp in the future (clock skew safety)", () => {
    const lastInboundAt = new Date(now.getTime() + 60 * 1000).toISOString();
    expect(isWithinReplyWindow(lastInboundAt, now)).toBe(false);
  });
});
