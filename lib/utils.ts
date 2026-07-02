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
