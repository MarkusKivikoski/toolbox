import { useId, useState } from "react";
import type { BudgetSlice } from "@/lib/budget";
import { formatEur, formatPercent } from "@/lib/format";
import { PAID_COPY, SPENDING_COPY } from "../copy";
import { PERCENT_LOCALE } from "../constants";
import type { SpendingActions } from "../hooks/useSpendingActions";
import SpendingMeter from "./SpendingMeter";
import SpendingPanel from "./SpendingPanel";

type Props = {
  slice: BudgetSlice;
  isActive: boolean;
  spendingActions: SpendingActions;
  onActiveChange: (id: string | null) => void;
  onTogglePaid: (id: string) => void;
};

/**
 * One legend line: paid tick, colour dot, name, share and amount. A section's
 * name doubles as the toggle for its spending log, which opens beneath the row.
 */
export default function BudgetLegendRow({
  slice,
  isActive,
  spendingActions,
  onActiveChange,
  onTogglePaid,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const nameClassName = `truncate text-sm ${
    slice.isRemainder
      ? "text-zinc-500 dark:text-zinc-400"
      : slice.isPaid
        ? "text-zinc-400 line-through dark:text-zinc-500"
        : "text-zinc-700 dark:text-zinc-200"
  }`;

  return (
    <li
      onMouseEnter={() => onActiveChange(slice.id)}
      onMouseLeave={() => onActiveChange(null)}
      className={`rounded-lg transition-colors ${
        isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-2 py-1.5">
        {slice.isRemainder ? (
          <span className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <input
            type="checkbox"
            checked={slice.isPaid}
            onChange={() => onTogglePaid(slice.id)}
            aria-label={PAID_COPY.markPaid(slice.name)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
          />
        )}
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${
            slice.isRemainder ? "bg-zinc-200 dark:bg-zinc-700" : ""
          }`}
          style={{ backgroundColor: slice.color ?? undefined }}
          aria-hidden
        />
        {slice.isRemainder ? (
          <span className={`min-w-0 flex-1 ${nameClassName}`}>{slice.name}</span>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen((wasOpen) => !wasOpen)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={SPENDING_COPY.toggle(slice.name)}
            className="group flex min-w-0 flex-1 items-center gap-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <span className={nameClassName}>{slice.name}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 ${
                isOpen ? "rotate-90" : ""
              }`}
              aria-hidden
            >
              <path d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" />
            </svg>
          </button>
        )}
        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
          {formatPercent(slice.fraction, { locale: PERCENT_LOCALE })}
        </span>
        <span
          className={`w-20 shrink-0 text-right text-sm font-semibold tabular-nums ${
            slice.isPaid
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {formatEur(slice.amount)}
        </span>
      </div>

      {slice.spending && <SpendingMeter name={slice.name} summary={slice.spending} />}
      {isOpen && !slice.isRemainder && (
        <SpendingPanel
          id={panelId}
          sectionId={slice.id}
          sectionName={slice.name}
          entries={slice.spending?.entries ?? []}
          actions={spendingActions}
        />
      )}
    </li>
  );
}
