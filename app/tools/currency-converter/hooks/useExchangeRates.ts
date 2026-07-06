import { useEffect, useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  buildRatesUrl,
  isSnapshotFresh,
  normalizeRatesSnapshot,
  parseRatesResponse,
  snapshotCoversCurrencies,
  type ExchangeRatesState,
  type RatesSnapshot,
} from "@/lib/currency-converter";
import { RATES_CACHE_STORAGE_KEY, RATES_MAX_AGE_MS } from "../constants";

type ExchangeRates = {
  ratesState: ExchangeRatesState;
  onRetry: () => void;
};

/**
 * The outcome of the most recent completed fetch. Keyed by the request's
 * currency set so a failure for an old set doesn't taint the current one —
 * and so a snapshot that legitimately can't cover every requested currency
 * doesn't trigger an endless refetch of the same set.
 */
type SettledRequest = {
  requestKey: string;
  error: string | null;
};

const normalizeStoredSnapshot = (stored: unknown): RatesSnapshot | null =>
  normalizeRatesSnapshot(stored);

/**
 * The fetch/cache/offline logic. The cached snapshot lives in `localStorage`
 * through the shared storage-backed hook, so a revisit renders saved rates
 * immediately; one fetch runs only when the cache is missing, expired, or
 * doesn't cover the needed currencies. The displayed state is derived during
 * render — no state is set synchronously in the effect. No automatic
 * retries; the caller re-triggers via `onRetry`.
 *
 * `isEnabled` should be the settings hydration flag, so the first fetch waits
 * for the persisted currency list instead of requesting the defaults.
 */
export function useExchangeRates(
  neededCurrencies: readonly string[],
  isEnabled: boolean,
): ExchangeRates {
  const { value: cachedSnapshot, setValue: setCachedSnapshot } =
    useLocalStorageState<RatesSnapshot | null>({
      storageKey: RATES_CACHE_STORAGE_KEY,
      defaultValue: null,
      normalize: normalizeStoredSnapshot,
    });
  const [lastSettled, setLastSettled] = useState<SettledRequest | null>(null);

  // A stable key for the needed set — the effect must not re-run (and
  // refetch) just because the caller passed a new array with the same codes.
  const neededKey = [
    ...new Set(neededCurrencies.map((code) => code.toUpperCase())),
  ]
    .sort()
    .join(",");

  useEffect(() => {
    if (!isEnabled) return;
    const neededCodes = neededKey.split(",").filter((code) => code !== "");

    const cacheServes =
      cachedSnapshot !== null &&
      snapshotCoversCurrencies(cachedSnapshot, neededCodes) &&
      isSnapshotFresh(cachedSnapshot, Date.now(), RATES_MAX_AGE_MS);
    // A settled failure blocks auto-retry (manual Retry only). A settled
    // success only counts while its snapshot is still around — if the cache
    // vanishes (cross-tab clear), fetch again rather than show "loading"
    // forever.
    const alreadyTried =
      lastSettled?.requestKey === neededKey &&
      (lastSettled.error !== null || cachedSnapshot !== null);
    if (cacheServes || alreadyTried) return;

    let isCancelled = false;
    fetch(buildRatesUrl(neededCodes))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: unknown) => {
        if (isCancelled) return;
        const snapshot = parseRatesResponse(payload, Date.now());
        if (!snapshot) {
          setLastSettled({
            requestKey: neededKey,
            error: "Unexpected response from the rates service",
          });
          return;
        }
        setCachedSnapshot(snapshot);
        setLastSettled({ requestKey: neededKey, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setLastSettled({
          requestKey: neededKey,
          error: error instanceof Error ? error.message : "Network error",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [neededKey, isEnabled, cachedSnapshot, lastSettled, setCachedSnapshot]);

  const failureMessage =
    lastSettled?.requestKey === neededKey ? lastSettled.error : null;

  let ratesState: ExchangeRatesState;
  if (cachedSnapshot === null) {
    ratesState =
      failureMessage !== null
        ? { status: "unavailable", error: failureMessage }
        : { status: "loading" };
  } else if (failureMessage !== null) {
    ratesState = { status: "stale", snapshot: cachedSnapshot, error: failureMessage };
  } else {
    // Optimistically fresh — including the brief revalidation window after
    // the TTL expires, when the previous day's rates are still shown.
    ratesState = { status: "fresh", snapshot: cachedSnapshot };
  }

  return {
    ratesState,
    onRetry: () => setLastSettled(null),
  };
}
