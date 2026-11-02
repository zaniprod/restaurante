import { describe, expect, test } from "vitest";
import { brazilDayEnd, brazilDayStart, currentMonthRangeInBrazil, toBrazilDate, todayInBrazil } from "./date";

describe("brazilDayStart / brazilDayEnd", () => {
  test("produce Brasília-time (UTC-3) boundaries for the given date", () => {
    expect(brazilDayStart("2026-11-02")).toBe("2026-11-02T00:00:00-03:00");
    expect(brazilDayEnd("2026-11-02")).toBe("2026-11-02T23:59:59.999-03:00");
  });
});

describe("toBrazilDate", () => {
  test("a sale made at 21:30 Brasília time (already past midnight UTC) stays on that local day", () => {
    // 2026-11-02 21:30 in Brasília (UTC-3) is 2026-11-03 00:30 UTC.
    expect(toBrazilDate("2026-11-03T00:30:00.000Z")).toBe("2026-11-02");
  });

  test("a sale just before midnight Brasília time is still counted on that day", () => {
    expect(toBrazilDate("2026-11-02T23:59:00.000-03:00")).toBe("2026-11-02");
  });
});

describe("todayInBrazil", () => {
  test("returns a YYYY-MM-DD string", () => {
    expect(todayInBrazil()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("currentMonthRangeInBrazil", () => {
  test("from/to bound the first and last day of the current month, dates lists every day in order", () => {
    const { from, to, dates } = currentMonthRangeInBrazil();

    expect(from.endsWith("-01")).toBe(true);
    expect(dates[0]).toBe(from);
    expect(dates[dates.length - 1]).toBe(to);

    for (let i = 1; i < dates.length; i++) {
      const prevDay = Number(dates[i - 1].slice(-2));
      const day = Number(dates[i].slice(-2));
      expect(day).toBe(prevDay + 1);
    }
  });
});
