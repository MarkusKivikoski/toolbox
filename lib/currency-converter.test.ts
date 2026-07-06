import { describe, it, expect } from "vitest";
import {
  buildRatesUrl,
  convertAmount,
  DEFAULT_CONVERTER_SETTINGS,
  isSnapshotFresh,
  normalizeConverterSettings,
  normalizeRatesSnapshot,
  parseRatesResponse,
  snapshotCoversCurrencies,
  type RatesSnapshot,
} from "@/lib/currency-converter";

const FETCHED_AT = 1_750_000_000_000;

const snapshot = (
  eurRatesByCurrency: Record<string, number>,
  overrides: Partial<RatesSnapshot> = {},
): RatesSnapshot => ({
  eurRatesByCurrency,
  ratesDate: "2026-07-06",
  fetchedAt: FETCHED_AT,
  ...overrides,
});

const apiRow = (quote: string, rate: number, date = "2026-07-06") => ({
  date,
  base: "EUR",
  quote,
  rate,
});

const SUPPORTED_CODES = ["EUR", "USD", "GBP", "SEK", "JPY"];

describe("parseRatesResponse", () => {
  it("builds a snapshot from a valid flat array", () => {
    const parsed = parseRatesResponse(
      [apiRow("USD", 1.1445), apiRow("GBP", 0.85702)],
      FETCHED_AT,
    );
    expect(parsed).toEqual(
      snapshot({ USD: 1.1445, GBP: 0.85702 }),
    );
  });

  it("reports the newest date when rows differ", () => {
    const parsed = parseRatesResponse(
      [apiRow("USD", 1.1, "2026-07-03"), apiRow("GBP", 0.9, "2026-07-06")],
      FETCHED_AT,
    );
    expect(parsed?.ratesDate).toBe("2026-07-06");
  });

  it("returns null for non-array payloads", () => {
    expect(parseRatesResponse(null, FETCHED_AT)).toBeNull();
    expect(parseRatesResponse({ rates: {} }, FETCHED_AT)).toBeNull();
    expect(parseRatesResponse("oops", FETCHED_AT)).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(parseRatesResponse([], FETCHED_AT)).toBeNull();
  });

  it("skips rows with malformed rates, dates, or a non-EUR base", () => {
    const parsed = parseRatesResponse(
      [
        apiRow("USD", 1.1445),
        { ...apiRow("GBP", Number.NaN) },
        { ...apiRow("SEK", 11.04), date: "not-a-date" },
        { ...apiRow("JPY", 170), base: "USD" },
        { ...apiRow("CHF", -1) },
      ],
      FETCHED_AT,
    );
    expect(parsed?.eurRatesByCurrency).toEqual({ USD: 1.1445 });
  });
});

describe("convertAmount", () => {
  const rates = snapshot({ USD: 2, SEK: 10 });

  it("converts EUR to a quoted currency", () => {
    expect(convertAmount(100, "EUR", "USD", rates)).toBe(200);
  });

  it("converts a quoted currency back to EUR", () => {
    expect(convertAmount(200, "USD", "EUR", rates)).toBe(100);
  });

  it("converts between two quoted currencies via the EUR cross rate", () => {
    expect(convertAmount(20, "USD", "SEK", rates)).toBe(100);
  });

  it("is the identity for a same-currency pair", () => {
    expect(convertAmount(123.45, "USD", "USD", rates)).toBe(123.45);
  });

  it("converts zero to zero", () => {
    expect(convertAmount(0, "EUR", "USD", rates)).toBe(0);
  });

  it("returns null when either currency is missing from the snapshot", () => {
    expect(convertAmount(100, "EUR", "CHF", rates)).toBeNull();
    expect(convertAmount(100, "CHF", "EUR", rates)).toBeNull();
  });
});

describe("snapshotCoversCurrencies", () => {
  const rates = snapshot({ USD: 2 });

  it("always covers EUR", () => {
    expect(snapshotCoversCurrencies(rates, ["EUR"])).toBe(true);
  });

  it("covers quoted currencies and flags missing ones", () => {
    expect(snapshotCoversCurrencies(rates, ["EUR", "USD"])).toBe(true);
    expect(snapshotCoversCurrencies(rates, ["USD", "GBP"])).toBe(false);
  });

  it("covers the empty set", () => {
    expect(snapshotCoversCurrencies(rates, [])).toBe(true);
  });
});

describe("isSnapshotFresh", () => {
  const maxAgeMs = 6 * 60 * 60 * 1000;
  const rates = snapshot({ USD: 2 });

  it("is fresh strictly inside the max age", () => {
    expect(isSnapshotFresh(rates, FETCHED_AT + maxAgeMs - 1, maxAgeMs)).toBe(true);
  });

  it("expires exactly at the max age", () => {
    expect(isSnapshotFresh(rates, FETCHED_AT + maxAgeMs, maxAgeMs)).toBe(false);
  });
});

describe("buildRatesUrl", () => {
  it("sorts, dedupes, uppercases, and excludes EUR", () => {
    const url = buildRatesUrl(["SEK", "usd", "USD", "EUR", "GBP"]);
    expect(url).toBe(
      "https://api.frankfurter.dev/v2/rates?base=EUR&quotes=GBP%2CSEK%2CUSD",
    );
  });

  it("is stable for the same set in a different order", () => {
    expect(buildRatesUrl(["USD", "GBP"])).toBe(buildRatesUrl(["GBP", "USD"]));
  });
});

describe("normalizeConverterSettings", () => {
  it("returns defaults for null and non-object input", () => {
    expect(normalizeConverterSettings(null, SUPPORTED_CODES)).toEqual(
      DEFAULT_CONVERTER_SETTINGS,
    );
    expect(normalizeConverterSettings("junk", SUPPORTED_CODES)).toEqual(
      DEFAULT_CONVERTER_SETTINGS,
    );
    expect(normalizeConverterSettings({}, SUPPORTED_CODES)).toEqual(
      DEFAULT_CONVERTER_SETTINGS,
    );
  });

  it("uppercases and dedupes target currencies", () => {
    const settings = normalizeConverterSettings(
      { baseCurrency: "eur", targetCurrencies: ["usd", "USD", "gbp"] },
      SUPPORTED_CODES,
    );
    expect(settings.baseCurrency).toBe("EUR");
    expect(settings.targetCurrencies).toEqual(["USD", "GBP"]);
  });

  it("drops unsupported codes and non-strings", () => {
    const settings = normalizeConverterSettings(
      { targetCurrencies: ["USD", "XXX", 42, null] },
      SUPPORTED_CODES,
    );
    expect(settings.targetCurrencies).toEqual(["USD"]);
  });

  it("removes the base currency from the targets", () => {
    const settings = normalizeConverterSettings(
      { baseCurrency: "USD", targetCurrencies: ["USD", "SEK"] },
      SUPPORTED_CODES,
    );
    expect(settings.targetCurrencies).toEqual(["SEK"]);
  });

  it("keeps a deliberately emptied target list empty", () => {
    const settings = normalizeConverterSettings(
      { targetCurrencies: [] },
      SUPPORTED_CODES,
    );
    expect(settings.targetCurrencies).toEqual([]);
  });

  it("falls back to the default base for unsupported codes", () => {
    const settings = normalizeConverterSettings(
      { baseCurrency: "XXX" },
      SUPPORTED_CODES,
    );
    expect(settings.baseCurrency).toBe(DEFAULT_CONVERTER_SETTINGS.baseCurrency);
  });

  it("falls back to the default amount for non-string values", () => {
    const settings = normalizeConverterSettings(
      { amount: 100 },
      SUPPORTED_CODES,
    );
    expect(settings.amount).toBe(DEFAULT_CONVERTER_SETTINGS.amount);
  });
});

describe("normalizeRatesSnapshot", () => {
  const validStored = {
    eurRatesByCurrency: { USD: 1.1445, SEK: 11.04 },
    ratesDate: "2026-07-06",
    fetchedAt: FETCHED_AT,
  };

  it("round-trips a valid snapshot", () => {
    expect(normalizeRatesSnapshot(validStored)).toEqual(validStored);
  });

  it("rejects a missing or malformed date", () => {
    expect(normalizeRatesSnapshot({ ...validStored, ratesDate: undefined })).toBeNull();
    expect(normalizeRatesSnapshot({ ...validStored, ratesDate: "yesterday" })).toBeNull();
  });

  it("rejects a missing fetchedAt", () => {
    expect(normalizeRatesSnapshot({ ...validStored, fetchedAt: undefined })).toBeNull();
  });

  it("drops non-finite rates and rejects the snapshot when none survive", () => {
    const partiallyBroken = normalizeRatesSnapshot({
      ...validStored,
      eurRatesByCurrency: { USD: 1.1445, SEK: Number.NaN },
    });
    expect(partiallyBroken?.eurRatesByCurrency).toEqual({ USD: 1.1445 });

    expect(
      normalizeRatesSnapshot({
        ...validStored,
        eurRatesByCurrency: { SEK: Number.POSITIVE_INFINITY },
      }),
    ).toBeNull();
  });

  it("rejects null and non-object input", () => {
    expect(normalizeRatesSnapshot(null)).toBeNull();
    expect(normalizeRatesSnapshot("junk")).toBeNull();
  });
});
