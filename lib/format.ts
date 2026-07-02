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

const percentFormatters = new Map<string, Intl.NumberFormat>();

function percentFormatter(locale: string, maximumFractionDigits: number): Intl.NumberFormat {
  const key = `${locale}:${maximumFractionDigits}`;
  let formatter = percentFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits,
    });
    percentFormatters.set(key, formatter);
  }
  return formatter;
}

type FormatPercentOptions = {
  /** Prefix a "+" on positive values (negatives already carry a "−"). */
  signed?: boolean;
  maximumFractionDigits?: number;
  locale?: string;
  /** What to show when the fraction isn't a finite number. */
  nonFinite?: string;
};

/** Format a fraction as a percent, e.g. 0.42 → "42 %" (or "+42 %" when signed). */
export function formatPercent(
  fraction: number,
  {
    signed = false,
    maximumFractionDigits = 0,
    locale = "en",
    nonFinite = "–",
  }: FormatPercentOptions = {},
): string {
  if (!Number.isFinite(fraction)) return nonFinite;
  const formatted = percentFormatter(locale, maximumFractionDigits).format(fraction);
  return signed && fraction > 0 ? `+${formatted}` : formatted;
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
