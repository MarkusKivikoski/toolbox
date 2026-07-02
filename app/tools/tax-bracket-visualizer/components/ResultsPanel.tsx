import { memo } from "react";
import { formatEur, formatPercent } from "@/lib/format";
import type { TaxBreakdown } from "@/lib/tax-bracket-visualizer";
import { COPY } from "../copy";

type Props = {
  breakdown: TaxBreakdown;
};

const RATE_FRACTION_DIGITS = 1;

/** The four headline figures; the marginal rate carries the emphasis. */
function ResultsPanel({ breakdown }: Props) {
  const figures = [
    { label: COPY.netAnnualLabel, value: formatEur(breakdown.netAnnual) },
    { label: COPY.netMonthlyLabel, value: formatEur(breakdown.netMonthly) },
    {
      label: COPY.effectiveRateLabel,
      value: formatPercent(breakdown.effectiveRate, {
        maximumFractionDigits: RATE_FRACTION_DIGITS,
      }),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {figures.map((figure) => (
        <div
          key={figure.label}
          className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {figure.label}
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">{figure.value}</div>
        </div>
      ))}
      <div className="rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10">
        <div className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {COPY.marginalRateLabel}
        </div>
        <div className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
          {formatPercent(breakdown.marginalRate, {
            maximumFractionDigits: RATE_FRACTION_DIGITS,
          })}
        </div>
        <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
          {COPY.marginalRateHint}
        </div>
      </div>
    </div>
  );
}

export default memo(ResultsPanel);
