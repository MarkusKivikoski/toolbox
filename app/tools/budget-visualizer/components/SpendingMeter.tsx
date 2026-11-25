import type { SpendingSummary } from "@/lib/budgetSpending";
import { formatEurPrecise } from "@/lib/format";
import { MIN_VISIBLE_PROGRESS_PCT } from "../constants";
import { SPENDING_COPY } from "../copy";

type Props = {
  /** The section's name, for the bar's accessible label. */
  name: string;
  summary: SpendingSummary;
};

/** A thin bar showing how much of a section's amount the log has used. */
export default function SpendingMeter({ name, summary }: Props) {
  const { spent, left, fraction, isOver } = summary;
  const fillPercent = Math.max(fraction * 100, spent > 0 ? MIN_VISIBLE_PROGRESS_PCT : 0);

  return (
    // Left padding lines the bar up under the row's name (checkbox + dot + gaps).
    <div className="pb-1.5 pl-[3.25rem] pr-2">
      <div
        role="progressbar"
        aria-label={SPENDING_COPY.meter(name)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fraction * 100)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      >
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between gap-2 text-xs tabular-nums">
        <span className="text-zinc-500 dark:text-zinc-400">
          {SPENDING_COPY.used(formatEurPrecise(spent))}
        </span>
        <span
          className={
            isOver
              ? "font-medium text-amber-700 dark:text-amber-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {isOver
            ? SPENDING_COPY.over(formatEurPrecise(-left))
            : SPENDING_COPY.left(formatEurPrecise(left))}
        </span>
      </div>
    </div>
  );
}
