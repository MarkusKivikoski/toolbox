// Generic, domain-free helpers for the currency converter tool.

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currencyCode: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currencyCode);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: currencyCode,
    });
    currencyFormatters.set(currencyCode, formatter);
  }
  return formatter;
}

/** "1 234,50 $" — format a figure in any ISO 4217 currency. */
export function formatCurrencyAmount(value: number, currencyCode: string): string {
  return currencyFormatter(currencyCode).format(Number.isFinite(value) ? value : 0);
}
