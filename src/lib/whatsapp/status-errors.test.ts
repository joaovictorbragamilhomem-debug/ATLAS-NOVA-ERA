import { describe, expect, it } from "vitest";
import { describeStatusErrors } from "./status-errors";

describe("describeStatusErrors", () => {
  it("joins code, title and details of a failed delivery", () => {
    expect(
      describeStatusErrors([
        {
          code: 131026,
          title: "Message undeliverable",
          message: "Message undeliverable",
          error_data: { details: "Receiver is incapable of receiving this message" },
        },
      ])
    ).toBe("#131026 — Message undeliverable — Receiver is incapable of receiving this message");
  });

  it("falls back to message when there is no title", () => {
    expect(describeStatusErrors([{ code: 131042, message: "Business eligibility payment issue" }])).toBe(
      "#131042 — Business eligibility payment issue"
    );
  });

  it("returns null when Meta sent no error details", () => {
    expect(describeStatusErrors(undefined)).toBeNull();
    expect(describeStatusErrors([])).toBeNull();
    expect(describeStatusErrors([{}])).toBeNull();
  });
});
