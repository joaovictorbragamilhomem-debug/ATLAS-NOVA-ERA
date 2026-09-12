import { describe, expect, it } from "vitest";
import {
  addDaysToISODate,
  addMonthsToISODate,
  addMonthsToYearMonth,
  daysInMonth,
  isoDateToLocalDate,
  localDateToISODate,
  nextDueDateForPeriodicity,
  weekdayOfISODate,
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

describe("daysInMonth", () => {
  it("returns 30 for September", () => {
    expect(daysInMonth("2026-09")).toBe(30);
  });
  it("returns 28 for a non-leap February", () => {
    expect(daysInMonth("2026-02")).toBe(28);
  });
  it("returns 29 for a leap February", () => {
    expect(daysInMonth("2028-02")).toBe(29);
  });
});

describe("weekdayOfISODate", () => {
  it("matches the known weekday for a fixed date", () => {
    // 2026-09-12 is a Saturday
    expect(weekdayOfISODate("2026-09-12")).toBe(6);
    // 2026-09-01 is a Tuesday
    expect(weekdayOfISODate("2026-09-01")).toBe(2);
  });
});

describe("addMonthsToYearMonth", () => {
  it("moves forward and backward across year boundaries", () => {
    expect(addMonthsToYearMonth("2026-09", 1)).toBe("2026-10");
    expect(addMonthsToYearMonth("2026-01", -1)).toBe("2025-12");
    expect(addMonthsToYearMonth("2026-12", 1)).toBe("2027-01");
  });
});
