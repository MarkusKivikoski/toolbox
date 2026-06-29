// Finnish purchasing-power engine — no React, fully unit-testable.
//
// Backed by Statistics Finland's cost-of-living index (1914:1–6 = 100), annual
// averages, table StatFin 11xy (1860–2025). This is the exact series behind the
// official "money value converter" (rahanarvonmuunnin): a single continuous
// price-level index spanning the 1963 currency reform and the 2002 euro changeover.
//
// Source: https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__khi/statfin_khi_pxt_11xy.px/

export const INDEX_START_YEAR = 1860;

/** Annual-average cost-of-living index (1914:1–6 = 100), one value per year from 1860. */
export const COST_OF_LIVING_INDEX: readonly number[] = [
  78, 86, 101, 94, 89, 91, 84, 90, 89, 81, 77, 82,
  88, 88, 95, 95, 95, 92, 83, 77, 86, 91, 85, 82,
  81, 76, 69, 67, 68, 72, 75, 85, 89, 84, 76, 74,
  75, 78, 81, 84, 86, 85, 85, 84, 85, 84, 88, 91,
  95, 94, 94, 98, 100, 100, 100, 116, 157, 313, 1058, 938,
  937, 1171, 1139, 1147, 1170, 1212, 1183, 1207, 1233, 1225, 1129, 1039,
  1025, 1001, 983, 997, 998, 1051, 1072, 1100, 1302, 1546, 1827, 2060,
  2182, 3058, 4885, 6343, 8533, 8680, 9891, 11524, 11988, 12152, 11953, 11543,
  12889, 14621, 15956, 16201, 16724, 17027, 17786, 18652, 20583, 21576, 22424, 23686,
  25671, 26256, 26972, 28722, 30772, 34380, 40362, 47557, 54375, 61257, 65885, 70691,
  78867, 88353, 96557, 104813, 112144, 118737, 123000, 127504, 133758, 142569, 151246, 157487,
  161581, 164981, 166777, 168410, 169396, 171483, 173893, 175915, 181842, 186534, 189439, 191101,
  191459, 193107, 196509, 201440, 209614, 209632, 212189, 219545, 225711, 229048, 231432, 230957,
  231778, 233529, 236055, 238475, 239166, 244417, 261824, 278191, 282549, 283504,
];

export const MIN_YEAR = INDEX_START_YEAR;
export const MAX_YEAR = INDEX_START_YEAR + COST_OF_LIVING_INDEX.length - 1;

/** Index point for a given year, or `undefined` if outside the series. */
export function indexForYear(year: number): number | undefined {
  return COST_OF_LIVING_INDEX[year - INDEX_START_YEAR];
}

export function isYearAvailable(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

/** All available years, newest first — convenient for dropdowns. */
export function yearsDescending(): number[] {
  const out: number[] = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) out.push(y);
  return out;
}

/**
 * Convert a euro amount from one year's price level to another, preserving
 * purchasing power. `amount` is read as euros of `fromYear`; the result is the
 * euros of `toYear` that buy the same basket of goods. Returns NaN if a year is
 * out of range.
 */
export function convert(amount: number, fromYear: number, toYear: number): number {
  const from = indexForYear(fromYear);
  const to = indexForYear(toYear);
  if (!from || !to || !Number.isFinite(amount)) return NaN;
  return (amount * to) / from;
}

/** Total price-level change going from `fromYear` to `toYear`, as a fraction (0.5 = +50%). */
export function priceChange(fromYear: number, toYear: number): number {
  const from = indexForYear(fromYear);
  const to = indexForYear(toYear);
  if (!from || !to) return NaN;
  return to / from - 1;
}

/**
 * Average annual inflation between the two years (geometric mean), as a fraction.
 * Always measured chronologically (earlier → later), so the sign reflects real
 * history regardless of which year the user put first. 0 when the years match.
 */
export function annualInflation(fromYear: number, toYear: number): number {
  if (fromYear === toYear) return 0;
  const earlier = Math.min(fromYear, toYear);
  const later = Math.max(fromYear, toYear);
  const a = indexForYear(earlier);
  const b = indexForYear(later);
  if (!a || !b) return NaN;
  return Math.pow(b / a, 1 / (later - earlier)) - 1;
}

// --- Historical currency units ----------------------------------------------
// The euro replaced the markka in 2002 at an irrevocable rate of 5.94573 mk/€.
// The 1963 currency reform redenominated 100 "old" markka into 1 "new" markka.

const FIM_PER_EUR = 5.94573;
const NEW_MARKKA_FROM_YEAR = 1963;
const EURO_FROM_YEAR = 2002;

export type Era = {
  /** Currency in circulation that year. */
  code: "EUR" | "FIM" | "FIM_OLD";
  /** Short unit label for display. */
  unit: string;
  /** How many of that currency's units equal one euro. */
  perEur: number;
};

export function eraFor(year: number): Era {
  if (year >= EURO_FROM_YEAR) return { code: "EUR", unit: "€", perEur: 1 };
  if (year >= NEW_MARKKA_FROM_YEAR) return { code: "FIM", unit: "mk", perEur: FIM_PER_EUR };
  return { code: "FIM_OLD", unit: "old mk", perEur: FIM_PER_EUR * 100 };
}

/**
 * Express a euro amount in the actual currency Finns carried in `year` — markka
 * before 2002 (and pre-1963 "old" markka before the reform), euro otherwise.
 */
export function inEraCurrency(amountEur: number, year: number): number {
  return amountEur * eraFor(year).perEur;
}
