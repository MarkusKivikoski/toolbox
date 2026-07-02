import { annualInflation, convert, priceChange } from "@/lib/cost-of-living";
import { formatEur, formatPercent } from "@/lib/format";
import { SALARY_CHANGE_EPSILON_EUR } from "../constants";
import PurchasingPowerChart from "./PurchasingPowerChart";

type Props = {
  baselineYear: number;
  nowYear: number;
  baselineSalary: number;
  nowSalary: number;
};

/** Fraction as a signed Finnish percent, e.g. "+12,3 %". */
function formatChangePercent(fraction: number): string {
  return formatPercent(fraction, {
    signed: true,
    maximumFractionDigits: 1,
    locale: "fi-FI",
  });
}

/**
 * The full comparison: the inflation-parity target for the later year, how the
 * actual later salary measures against it, the inflation context, and the chart.
 */
export default function ComparisonResult({
  baselineYear,
  nowYear,
  baselineSalary,
  nowSalary,
}: Props) {
  const hasNow = nowSalary > 0;

  // What the baseline salary would need to be in the later year to buy the same.
  const target = convert(baselineSalary, baselineYear, nowYear);
  const delta = nowSalary - target; // in today's (later-year) euros
  const pct = target > 0 ? delta / target : NaN;
  const rose = hasNow && delta > SALARY_CHANGE_EPSILON_EUR;
  const fell = hasNow && delta < -SALARY_CHANGE_EPSILON_EUR;

  const changeTone = rose
    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
    : fell
      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
  const changeAccent = rose
    ? "text-emerald-700 dark:text-emerald-400"
    : fell
      ? "text-amber-700 dark:text-amber-400"
      : "text-zinc-700 dark:text-zinc-200";

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
      {/* Inflation-parity target */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        To keep the buying power of{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {formatEur(baselineSalary)}
        </span>{" "}
        from {baselineYear}, your {nowYear} salary should be
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-4xl">
          {formatEur(target)}
        </span>
        <span className="text-lg font-medium text-zinc-500">/ month</span>
      </div>

      {/* Real buying-power change vs the actual later salary */}
      {hasNow && (
        <div className={`mt-4 rounded-xl border px-4 py-3 ${changeTone}`}>
          <div className="text-sm text-zinc-700 dark:text-zinc-200">
            Your buying power has{" "}
            <span className={`font-semibold ${changeAccent}`}>
              {rose
                ? `risen ${formatEur(delta)}/mo`
                : fell
                  ? `fallen ${formatEur(-delta)}/mo`
                  : "held steady"}
            </span>{" "}
            since {baselineYear}.
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {(rose || fell) && <>({formatChangePercent(pct)} in today&apos;s money) · </>}
            your {nowYear} pay of {formatEur(nowSalary)} vs the {formatEur(target)}{" "}
            needed
          </div>
        </div>
      )}

      {/* Inflation context */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cumulative inflation
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatChangePercent(priceChange(baselineYear, nowYear))}
          </div>
          <div className="text-xs text-zinc-400">
            {baselineYear} → {nowYear}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Average per year
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatChangePercent(annualInflation(baselineYear, nowYear))}
          </div>
          <div className="text-xs text-zinc-400">
            over {nowYear - baselineYear} years
          </div>
        </div>
      </div>

      <div className="mt-5">
        <PurchasingPowerChart
          baselineSalary={baselineSalary}
          baselineYear={baselineYear}
          nowYear={nowYear}
          actualNow={hasNow ? nowSalary : undefined}
        />
      </div>
    </div>
  );
}
