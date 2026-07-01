import type { TripHeadline, TripSavings } from "@/lib/budget";
import { formatDuration, formatEur } from "@/lib/format";
import { dateInMonths, pctFmt } from "../utils";
import { MIN_VISIBLE_PROGRESS_PCT } from "../constants";

type Props = {
  proj: TripSavings;
  headline: TripHeadline;
  perMonth: number;
  monthsUntil: number;
};

/** Trip-mode savings projection: the plan to have the trip paid for in time. */
export default function TripSavingsPanel({
  proj,
  headline,
  perMonth,
  monthsUntil,
}: Props) {
  return (
    <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Saving up for the trip
          </div>
          <div className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatEur(headline.value)}
            {headline.unit && (
              <span className="text-base font-medium text-zinc-400">
                {headline.unit}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-400">{headline.label}</div>
        </div>
        {proj.target > 0 && (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatEur(proj.balance)}{" "}
              <span className="font-normal text-zinc-400">
                of {formatEur(proj.target)}
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              {pctFmt.format(proj.progress)} saved
            </div>
          </div>
        )}
      </div>

      {proj.target > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${Math.max(
                proj.progress * 100,
                proj.progress > 0 ? MIN_VISIBLE_PROGRESS_PCT : 0,
              )}%`,
            }}
          />
        </div>
      )}

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        {proj.reached ? (
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            🎉 You&apos;ve saved enough for this trip!
          </span>
        ) : proj.target <= 0 ? (
          <span className="text-zinc-500">
            Add some trip costs to set your savings goal.
          </span>
        ) : proj.requiredPerMonth !== null ? (
          <span className="text-zinc-700 dark:text-zinc-200">
            Save{" "}
            <span className="font-semibold">
              {formatEur(proj.requiredPerMonth)}/mo
            </span>{" "}
            to have <span className="font-semibold">{formatEur(proj.target)}</span>{" "}
            ready in{" "}
            <span className="font-semibold">{formatDuration(monthsUntil / 12)}</span>{" "}
            (~{dateInMonths(monthsUntil)}).
            {perMonth > 0 &&
              (proj.onTrack ? (
                <>
                  {" "}
                  You&apos;re saving {formatEur(perMonth)}/mo —{" "}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    on track ✓
                  </span>
                </>
              ) : (
                <>
                  {" "}
                  You&apos;re saving {formatEur(perMonth)}/mo —{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {formatEur(proj.requiredPerMonth - perMonth)}/mo short
                  </span>
                  .
                </>
              ))}
          </span>
        ) : proj.monthsToAfford !== null ? (
          <span className="text-zinc-700 dark:text-zinc-200">
            At <span className="font-semibold">{formatEur(perMonth)}/mo</span>{" "}
            you&apos;ll have{" "}
            <span className="font-semibold">{formatEur(proj.target)}</span> saved in{" "}
            <span className="font-semibold">
              {formatDuration(proj.monthsToAfford / 12)}
            </span>{" "}
            (~{dateInMonths(proj.monthsToAfford)}).
          </span>
        ) : (
          <span className="text-zinc-500">
            Enter how much you can save each month — or when the trip is — to see a
            plan.
          </span>
        )}
      </div>
    </div>
  );
}
