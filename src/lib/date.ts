// Brazil has had no daylight saving time since 2019, so America/Sao_Paulo is a fixed
// UTC-3 offset — safe to hardcode rather than pull in a timezone library for it.
const BRAZIL_UTC_OFFSET = "-03:00";
const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

export function brazilDayStart(date: string): string {
  return `${date}T00:00:00${BRAZIL_UTC_OFFSET}`;
}

export function brazilDayEnd(date: string): string {
  return `${date}T23:59:59.999${BRAZIL_UTC_OFFSET}`;
}

export function toBrazilDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-CA", { timeZone: BRAZIL_TIME_ZONE });
}

export function todayInBrazil(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BRAZIL_TIME_ZONE });
}

export function currentMonthRangeInBrazil(): { from: string; to: string; dates: string[] } {
  const [year, month] = todayInBrazil().split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStr = String(month).padStart(2, "0");

  const dates = Array.from({ length: lastDay }, (_, i) => `${year}-${monthStr}-${String(i + 1).padStart(2, "0")}`);

  return { from: dates[0], to: dates[dates.length - 1], dates };
}
