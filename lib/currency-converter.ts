// Domain logic for the currency converter tool. Zero React imports — everything
// here is pure and unit-tested in lib/currency-converter.test.ts.
//
// Rates come from the free Frankfurter API (https://frankfurter.dev), always
// fetched with EUR as the canonical base. Every displayed pair is a cross rate
// derived client-side (rate A→B = eurRate(B) / eurRate(A)), so one cached
// snapshot serves any base currency the user picks without refetching.

import { formatAmountInput } from "./utils";

export const CANONICAL_BASE_CURRENCY = "EUR";

export const FRANKFURTER_RATES_URL = "https://api.frankfurter.dev/v2/rates";

/** Persisted under `toolbox.currency-converter.settings.v1`. */
export type ConverterSettings = {
  baseCurrency: string;
  /** Raw input string, comma-tolerant — parsed with `parseAmount` at render time. */
  amount: string;
  /** Ordered ISO 4217 codes shown in the conversion list. */
  targetCurrencies: string[];
};

/** Persisted under `toolbox.currency-converter.rates.v1`. */
export type RatesSnapshot = {
  /** Quote code → rate for 1 EUR. EUR itself is implicit (= 1). */
  eurRatesByCurrency: Record<string, number>;
  /** Publication date reported by the API, e.g. "2026-07-06". */
  ratesDate: string;
  /** Epoch ms of the successful fetch — drives the freshness check. */
  fetchedAt: number;
};

export type ExchangeRatesState =
  | { status: "loading" }
  | { status: "fresh"; snapshot: RatesSnapshot }
  | { status: "stale"; snapshot: RatesSnapshot; error: string }
  | { status: "unavailable"; error: string };

/** A clean slate, and the single source of `normalizeConverterSettings`'s
 *  fallbacks — so the defaults can't drift between the two. */
export const DEFAULT_CONVERTER_SETTINGS: ConverterSettings = {
  baseCurrency: CANONICAL_BASE_CURRENCY,
  amount: "100",
  targetCurrencies: ["USD", "GBP", "SEK"],
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && ISO_DATE_PATTERN.test(value);

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

function eurRateFor(currency: string, snapshot: RatesSnapshot): number | null {
  if (currency === CANONICAL_BASE_CURRENCY) return 1;
  const rate = snapshot.eurRatesByCurrency[currency];
  return isPositiveFiniteNumber(rate) ? rate : null;
}

/**
 * Validate the Frankfurter `/v2/rates` payload — a flat array of
 * `{date, base, quote, rate}` rows — into a snapshot. Rows that aren't
 * EUR-based or carry a malformed rate/date are skipped; returns `null` when
 * nothing usable remains.
 */
export function parseRatesResponse(
  payload: unknown,
  fetchedAt: number,
): RatesSnapshot | null {
  if (!Array.isArray(payload)) return null;
  const eurRatesByCurrency: Record<string, number> = {};
  let ratesDate = "";
  for (const row of payload) {
    if (typeof row !== "object" || row === null) continue;
    const { base, quote, rate, date } = row as Record<string, unknown>;
    if (base !== CANONICAL_BASE_CURRENCY) continue;
    if (typeof quote !== "string" || !isPositiveFiniteNumber(rate) || !isIsoDate(date)) {
      continue;
    }
    eurRatesByCurrency[quote.toUpperCase()] = rate;
    // Rows can in principle carry different dates; report the newest.
    if (date > ratesDate) ratesDate = date;
  }
  if (Object.keys(eurRatesByCurrency).length === 0) return null;
  return { eurRatesByCurrency, ratesDate, fetchedAt };
}

/**
 * Convert between any two currencies via the EUR cross rate. Returns `null`
 * when either currency is missing from the snapshot — the UI renders "—"
 * instead of a number.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  snapshot: RatesSnapshot,
): number | null {
  const fromRate = eurRateFor(fromCurrency, snapshot);
  const toRate = eurRateFor(toCurrency, snapshot);
  if (fromRate === null || toRate === null) return null;
  return amount * (toRate / fromRate);
}

/** Whether the snapshot can convert every listed currency (EUR always can). */
export function snapshotCoversCurrencies(
  snapshot: RatesSnapshot,
  currencyCodes: readonly string[],
): boolean {
  return currencyCodes.every((code) => eurRateFor(code, snapshot) !== null);
}

/** TTL check — `nowMs` is a parameter so tests don't depend on the clock. */
export function isSnapshotFresh(
  snapshot: RatesSnapshot,
  nowMs: number,
  maxAgeMs: number,
): boolean {
  return nowMs - snapshot.fetchedAt < maxAgeMs;
}

/**
 * Build the rates request URL with a sorted, deduped, EUR-excluded quotes
 * list — the string is stable for a given currency set, so the fetch hook can
 * key its effect on it.
 */
export function buildRatesUrl(neededCurrencies: readonly string[]): string {
  const quotes = [
    ...new Set(neededCurrencies.map((code) => code.toUpperCase())),
  ]
    .filter((code) => code !== CANONICAL_BASE_CURRENCY)
    .sort();
  const query = new URLSearchParams({
    base: CANONICAL_BASE_CURRENCY,
    quotes: quotes.join(","),
  });
  return `${FRANKFURTER_RATES_URL}?${query.toString()}`;
}

const isSupportedCode = (
  value: unknown,
  supportedCodes: readonly string[],
): value is string =>
  typeof value === "string" && supportedCodes.includes(value.toUpperCase());

/**
 * Fill in missing/invalid fields — used when loading saved or older data.
 * Codes outside `supportedCodes` are dropped so a stale save can't reference
 * currencies the picker no longer offers; the base is removed from targets.
 */
export function normalizeConverterSettings(
  partial: unknown,
  supportedCodes: readonly string[],
): ConverterSettings {
  const source = (
    typeof partial === "object" && partial !== null ? partial : {}
  ) as Partial<ConverterSettings>;

  const baseCurrency = isSupportedCode(source.baseCurrency, supportedCodes)
    ? source.baseCurrency.toUpperCase()
    : DEFAULT_CONVERTER_SETTINGS.baseCurrency;

  const storedTargets: unknown[] = Array.isArray(source.targetCurrencies)
    ? source.targetCurrencies
    : DEFAULT_CONVERTER_SETTINGS.targetCurrencies;
  const targetCurrencies = [
    ...new Set(
      storedTargets
        .filter((code): code is string => isSupportedCode(code, supportedCodes))
        .map((code) => code.toUpperCase()),
    ),
  ].filter((code) => code !== baseCurrency);

  return {
    baseCurrency,
    // Re-grouped on every load so amounts saved before thousands-grouping
    // shipped (or edited elsewhere) still render with spaces.
    amount: formatAmountInput(
      typeof source.amount === "string"
        ? source.amount
        : DEFAULT_CONVERTER_SETTINGS.amount,
    ),
    targetCurrencies,
  };
}

/**
 * Validate a cached snapshot read back from localStorage. Invalid caches are
 * discarded (`null`) rather than repaired — fabricating rates would be worse
 * than refetching.
 */
export function normalizeRatesSnapshot(partial: unknown): RatesSnapshot | null {
  if (typeof partial !== "object" || partial === null) return null;
  const source = partial as Partial<RatesSnapshot>;
  if (!isIsoDate(source.ratesDate)) return null;
  if (typeof source.fetchedAt !== "number" || !Number.isFinite(source.fetchedAt)) {
    return null;
  }
  if (typeof source.eurRatesByCurrency !== "object" || source.eurRatesByCurrency === null) {
    return null;
  }
  const eurRatesByCurrency: Record<string, number> = {};
  for (const [code, rate] of Object.entries(source.eurRatesByCurrency)) {
    if (isPositiveFiniteNumber(rate)) eurRatesByCurrency[code.toUpperCase()] = rate;
  }
  if (Object.keys(eurRatesByCurrency).length === 0) return null;
  return {
    eurRatesByCurrency,
    ratesDate: source.ratesDate,
    fetchedAt: source.fetchedAt,
  };
}
