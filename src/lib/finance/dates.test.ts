import { describe, expect, it } from "vitest";
import {
  addDaysToISODate,
  addMonthsToISODate,
  isoDateToLocalDate,
  localDateToISODate,
  nextDueDateForPeriodicity,
} from "./dates";

describe("addDaysToISODate", () => {
  it("adds days across a month boundary", () => {
    expect(addDaysToISODate("2026-09-28", 7)).toBe("2026-10-05");
  });
});

describe("addMonthsToISODate", () => {
  it("clamps to the last day of a shorter target month", () => {
    expect(addMonthsToISODate("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("respects leap years", () => {
    expect(addMonthsToISODate("2027-12-31", 2)).toBe("2028-02-29");
  });

  it("keeps the same day when the target month has enough days", () => {
    expect(addMonthsToISODate("2026-03-15", 1)).toBe("2026-04-15");
  });

  it("rolls over the year", () => {
    expect(addMonthsToISODate("2026-12-01", 1)).toBe("2027-01-01");
  });
});

describe("nextDueDateForPeriodicity", () => {
  it("weekly adds 7 days", () => {
    expect(nextDueDateForPeriodicity("2026-09-01", "weekly")).toBe("2026-09-08");
  });
  it("biweekly adds 14 days", () => {
    expect(nextDueDateForPeriodicity("2026-09-01", "biweekly")).toBe("2026-09-15");
  });
  it("monthly adds 1 calendar month", () => {
    expect(nextDueDateForPeriodicity("2026-09-01", "monthly")).toBe("2026-10-01");
  });
});

describe("localDateToISODate / isoDateToLocalDate", () => {
  it("round-trips without shifting the day", () => {
    const date = new Date(2026, 8, 15); // 15/set/2026, local midnight
    expect(localDateToISODate(date)).toBe("2026-09-15");
    expect(isoDateToLocalDate("2026-09-15").getDate()).toBe(15);
    expect(isoDateToLocalDate("2026-09-15").getMonth()).toBe(8);
    expect(isoDateToLocalDate("2026-09-15").getFullYear()).toBe(2026);
  });
});
