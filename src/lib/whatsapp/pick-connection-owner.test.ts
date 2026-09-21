import { describe, expect, it } from "vitest";
import { pickConnectionOwner } from "./pick-connection-owner";

describe("pickConnectionOwner", () => {
  it("returns null when nothing holds the number", () => {
    expect(pickConnectionOwner([])).toBeNull();
    expect(pickConnectionOwner(null)).toBeNull();
    expect(pickConnectionOwner(undefined)).toBeNull();
  });

  it("returns the only organization holding the number, connected or not", () => {
    expect(pickConnectionOwner([{ organization_id: "a", status: "connected" }])).toBe("a");
    expect(pickConnectionOwner([{ organization_id: "a", status: "disconnected" }])).toBe("a");
  });

  it("prefers the connected organization when two share the number", () => {
    expect(
      pickConnectionOwner([
        { organization_id: "old", status: "disconnected" },
        { organization_id: "current", status: "connected" },
      ])
    ).toBe("current");
    expect(
      pickConnectionOwner([
        { organization_id: "current", status: "connected" },
        { organization_id: "old", status: "disconnected" },
      ])
    ).toBe("current");
  });
});
