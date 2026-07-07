// Generic, domain-free helpers shared across tools. Anything here should be
// pasteable into an unrelated project unchanged.

/** Parse a free-typed euro figure, tolerating spaces and a comma decimal. */
export function parseAmount(input: string): number {
  const cleaned = input
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Insert thousands-grouping spaces into a free-typed amount, tolerating a
 *  comma decimal (mirrors `parseAmount`'s tolerance) — makes large figures
 *  like "1000000" read as "1 000 000" while still round-tripping through
 *  `parseAmount`. */
export function formatAmountInput(raw: string): string {
  const [integerDigits, ...decimalParts] = raw.replace(/[^\d,]/g, "").split(",");
  const groupedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decimalParts.length > 0
    ? `${groupedInteger},${decimalParts.join("")}`
    : groupedInteger;
}

// The only characters `formatAmountInput` keeps (besides the spaces it
// inserts/removes itself) — counting these, rather than digits alone, is
// what lets the caret land *after* a just-typed comma instead of before it
// (a comma matches this but not \d, so it still counts as "typed content").
const SIGNIFICANT_CHAR = /[\d,]/;
const countSignificantChars = (text: string): number =>
  (text.match(new RegExp(SIGNIFICANT_CHAR, "g")) ?? []).length;

/** The index in `formatted` right after the `nth` digit-or-comma — used to
 *  keep the caret stable as thousands spaces shift around it. */
function cursorPositionAfterSignificantChars(
  formatted: string,
  significantCharsBeforeCursor: number,
): number {
  if (significantCharsBeforeCursor <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (SIGNIFICANT_CHAR.test(formatted[index])) {
      seen++;
      if (seen === significantCharsBeforeCursor) return index + 1;
    }
  }
  return formatted.length;
}

export type FormattedAmountEdit = { formatted: string; cursor: number };

/** Reformat a free-typed amount with thousands-grouping spaces after an
 *  edit, returning where the caret should land so the inserted/removed
 *  spaces don't disrupt typing. */
export function editAmountInput(rawValue: string, cursorPosition: number): FormattedAmountEdit {
  const significantCharsBeforeCursor = countSignificantChars(rawValue.slice(0, cursorPosition));
  const formatted = formatAmountInput(rawValue);
  return {
    formatted,
    cursor: cursorPositionAfterSignificantChars(formatted, significantCharsBeforeCursor),
  };
}

/** The date as "YYYY-MM-DD" (the ISO date portion) — for timestamped filenames. */
export function dateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
