import type { InvestingResult } from "@/lib/investing";
import { formatEur } from "@/lib/format";

type HeadlineCardProps = {
  result: InvestingResult;
  showTodaysMoney: boolean;
};

/** The big projected-balance-at-retirement figure. */
export default function HeadlineCard({
  result,
  showTodaysMoney,
}: HeadlineCardProps) {
  // The year point at retirement already carries the inflation-adjusted value.
  const retirementPoint = result.points.find(
    (point) => point.year === result.accumulationYears,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-900">
      <div className="text-sm font-medium text-zinc-500">
        Projected balance at retirement · age {result.retirementAge}
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums break-words text-emerald-600 dark:text-emerald-400 sm:text-4xl">
        {formatEur(result.endOfAccumulationBalance)}
      </div>
      {showTodaysMoney && retirementPoint && (
        <div className="mt-1 text-sm text-zinc-500">
          ≈ {formatEur(retirementPoint.realBalance)} in today&apos;s money
        </div>
      )}
    </div>
  );
}
