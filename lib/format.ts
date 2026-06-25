const eur0 = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "12 345 €" — rounded, for headline figures. */
export function formatEur(value: number): string {
  return eur0.format(Number.isFinite(value) ? value : 0);
}

/** "12 345,67 €" — for precise figures. */
export function formatEur2(value: number): string {
  return eur2.format(Number.isFinite(value) ? value : 0);
}

/** Short axis labels: "€1.2M", "€450k", "€0". */
export function compactEur(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}€${Math.round(abs / 1_000)}k`;
  return `${sign}€${Math.round(abs)}`;
}

/** "3 yr 4 mo" from a fractional number of years. */
export function formatDuration(years: number): string {
  const totalMonths = Math.round(years * 12);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y > 0 && m > 0) return `${y} yr ${m} mo`;
  if (y > 0) return `${y} yr`;
  return `${m} mo`;
}
