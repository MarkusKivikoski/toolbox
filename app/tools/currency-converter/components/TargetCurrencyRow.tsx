import { formatCurrencyAmount } from "../utils";
import type { CurrencyInfo } from "../currencies.config";

type Props = {
  currency: CurrencyInfo;
  /** Null when the rates snapshot can't convert this currency — rendered as "—". */
  convertedAmount: number | null;
  onRemove: () => void;
};

/** One converted figure in the target list, with a remove control. */
export default function TargetCurrencyRow({
  currency,
  convertedAmount,
  onRemove,
}: Props) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{currency.code}</div>
        <div className="truncate text-xs text-zinc-500">{currency.name}</div>
      </div>
      <div className="text-lg font-semibold tabular-nums">
        {convertedAmount === null ? (
          <span className="text-zinc-400">—</span>
        ) : (
          formatCurrencyAmount(convertedAmount, currency.code)
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${currency.name}`}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </li>
  );
}
