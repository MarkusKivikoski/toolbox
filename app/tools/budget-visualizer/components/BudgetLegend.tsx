import type { BudgetSlice } from "@/lib/budget";
import { formatEur, formatPercent } from "@/lib/format";
import { PAID_COPY } from "../copy";
import { PERCENT_LOCALE } from "../constants";
import LegendTotalRow from "./LegendTotalRow";

type Props = {
  slices: BudgetSlice[];
  income: number;
  allocated: number;
  paid: number;
  unpaid: number;
  labels: { allocated: string; paid: string; unpaid: string };
  emptyMessage: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  onTogglePaid: (id: string) => void;
  onClearPaid: () => void;
};

/**
 * The list beneath the doughnut: one row per slice with a "paid" tick, plus
 * allocated / paid / unpaid totals (the last two once something is ticked).
 */
export default function BudgetLegend({
  slices,
  income,
  allocated,
  paid,
  unpaid,
  labels,
  emptyMessage,
  activeId,
  onActiveChange,
  onTogglePaid,
  onClearPaid,
}: Props) {
  if (slices.length === 0) {
    return <p className="mt-4 text-center text-sm text-zinc-400">{emptyMessage}</p>;
  }

  const hasPaid = paid > 0;
  const shareOfIncome = (amount: number) =>
    income > 0 ? amount / income : undefined;

  return (
    <ul className="mt-4 space-y-1">
      {slices.map((slice) => {
        const isActive = slice.id === activeId;
        return (
          <li
            key={slice.id}
            onMouseEnter={() => onActiveChange(slice.id)}
            onMouseLeave={() => onActiveChange(null)}
            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
              isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""
            }`}
          >
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
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                slice.isRemainder
                  ? "text-zinc-500 dark:text-zinc-400"
                  : slice.isPaid
                    ? "text-zinc-400 line-through dark:text-zinc-500"
                    : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {slice.name}
            </span>
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
          </li>
        );
      })}

      <LegendTotalRow
        isFirst
        label={labels.allocated}
        amount={allocated}
        fraction={shareOfIncome(allocated)}
      />
      {hasPaid && (
        <>
          <LegendTotalRow
            label={labels.paid}
            amount={paid}
            fraction={shareOfIncome(paid)}
          />
          <LegendTotalRow
            label={labels.unpaid}
            amount={unpaid}
            fraction={shareOfIncome(unpaid)}
            successMessage={unpaid <= 0 ? PAID_COPY.allPaid : undefined}
          />
          <li className="flex justify-end px-2 pt-1">
            <button
              type="button"
              onClick={onClearPaid}
              className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
            >
              {PAID_COPY.clearPaid}
            </button>
          </li>
        </>
      )}
    </ul>
  );
}
