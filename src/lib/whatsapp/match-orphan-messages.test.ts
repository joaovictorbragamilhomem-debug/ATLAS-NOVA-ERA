import { describe, expect, it } from "vitest";
import { matchOrphansToCustomers } from "./match-orphan-messages";

describe("matchOrphansToCustomers", () => {
  it("returns nothing when there are no orphans or no customers", () => {
    expect(matchOrphansToCustomers([], [{ id: "c1", whatsapp: "+5594991703949" }]).size).toBe(0);
    expect(matchOrphansToCustomers([{ id: "m1", customer_phone_digits: "9491703949" }], []).size).toBe(0);
  });

  it("links a message that arrived without the ninth digit to a customer saved with it", () => {
    const result = matchOrphansToCustomers(
      [{ id: "m1", customer_phone_digits: "9491703949" }],
      [{ id: "c1", whatsapp: "+5594991703949" }]
    );
    expect(result.get("c1")).toEqual(["m1"]);
  });

  it("groups several messages per customer and ignores numbers with no customer", () => {
    const result = matchOrphansToCustomers(
      [
        { id: "m1", customer_phone_digits: "9491703949" },
        { id: "m2", customer_phone_digits: "1198887777" },
        { id: "m3", customer_phone_digits: "94991703949" },
      ],
      [{ id: "c1", whatsapp: "+5594991703949" }]
    );
    expect(result.get("c1")).toEqual(["m1", "m3"]);
    expect(result.size).toBe(1);
  });

  it("handles a DDD 55 number and does not match the same last digits in another area code", () => {
    const result = matchOrphansToCustomers(
      [{ id: "m1", customer_phone_digits: "5598877665" }],
      [
        { id: "other-ddd", whatsapp: "+5511998877665" },
        { id: "c1", whatsapp: "+5555998877665" },
      ]
    );
    expect(result.get("c1")).toEqual(["m1"]);
    expect(result.has("other-ddd")).toBe(false);
  });
});
