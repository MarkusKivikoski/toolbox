export const SETTINGS_STORAGE_KEY = "toolbox.currency-converter.settings.v1";
export const RATES_CACHE_STORAGE_KEY = "toolbox.currency-converter.rates.v1";

// Frankfurter rates update once a day (~16:00 CET), so a 6-hour client TTL
// keeps us polite without ever showing meaningfully outdated figures.
export const RATES_MAX_AGE_MS = 6 * 60 * 60 * 1000;
