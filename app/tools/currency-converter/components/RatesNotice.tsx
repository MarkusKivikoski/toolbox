import type { ExchangeRatesState } from "@/lib/currency-converter";

type Props = {
  ratesState: ExchangeRatesState;
  onRetry: () => void;
};

const RETRY_BUTTON_CLASSES =
  "shrink-0 rounded-lg border border-current/30 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/50 dark:hover:bg-black/20";

/**
 * Surface degraded rate states: an amber banner when showing saved rates
 * after a failed refresh, a full card when there are no rates at all.
 * Renders nothing while loading or when rates are fresh.
 */
export default function RatesNotice({ ratesState, onRetry }: Props) {
  if (ratesState.status === "stale") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="flex-1">
          Couldn&apos;t update rates — using saved rates from{" "}
          <span className="font-medium tabular-nums">{ratesState.snapshot.ratesDate}</span>.
        </p>
        <button type="button" onClick={onRetry} className={RETRY_BUTTON_CLASSES}>
          Retry
        </button>
      </div>
    );
  }

  if (ratesState.status === "unavailable") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="flex-1">
          Exchange rates are unavailable right now — check your connection and
          try again.
        </p>
        <button type="button" onClick={onRetry} className={RETRY_BUTTON_CLASSES}>
          Retry
        </button>
      </div>
    );
  }

  return null;
}
