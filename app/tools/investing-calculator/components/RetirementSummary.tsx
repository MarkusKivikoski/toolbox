import type { InvestingInput, InvestingResult } from "@/lib/investing";
import { formatDuration, formatEur, formatPercent } from "@/lib/format";
import StatTile from "./StatTile";

type RetirementSummaryProps = {
  result: InvestingResult;
  input: InvestingInput;
};

/** The retirement drawdown results card: description, tiles, outcome note. */
export default function RetirementSummary({
  result,
  input,
}: RetirementSummaryProps) {
  const lasts = result.depletionYear === null;
  const isSpendDown = result.withdrawalMode === "spendDown";
  const isNet = result.withdrawalBasis === "net";
  const hasInflation = input.inflationPct > 0;
  const hasPension = input.retirement.kansanelake > 0;
  const isPensionActiveAtStart =
    hasPension && input.retirement.kansanelakeStartAge <= input.retirementAge;
  // When retiring before the pension starts, show a separate combined-income box.
  const showTotalIncomeTile =
    hasPension &&
    !isPensionActiveAtStart &&
    input.retirement.kansanelakeStartAge < input.lifeExpectancy;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Retirement drawdown
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        {isSpendDown ? (
          <>
            Spending down to ≈€0 by age {result.lifeExpectancy} — you can{" "}
            {isNet ? "spend" : "sell"} ≈
            {formatEur(isNet ? result.firstMonthlyNet : result.firstMonthlyGross)}
            /mo {isNet ? "net" : "gross"}
            {hasInflation ? " (rising with inflation)" : ""} from age{" "}
            {result.retirementAge} at {input.retirement.annualReturnPct}%.
          </>
        ) : (
          <>
            {isNet ? "Living on" : "Selling"}{" "}
            {formatEur(input.retirement.monthlyWithdrawal)}/month{" "}
            {isNet ? "net" : "gross"} from age {result.retirementAge} to{" "}
            {result.lifeExpectancy} — {result.retirementYears} years at{" "}
            {input.retirement.annualReturnPct}%.
          </>
        )}
      </p>

      <div
        className={`mt-4 grid grid-cols-1 gap-3 ${
          showTotalIncomeTile ? "sm:grid-cols-2" : "sm:grid-cols-3"
        }`}
      >
        <StatTile
          label="Monthly income (net)"
          value={`≈ ${formatEur(
            hasPension ? result.firstMonthlyTotalNet : result.firstMonthlyNet,
          )}`}
          accent="emerald"
          sub={
            hasPension
              ? isPensionActiveAtStart
                ? `${formatEur(result.firstMonthlyNet)} invest + ${formatEur(result.pensionNetMonthly)} pension`
                : `${formatEur(result.firstMonthlyNet)} invest · +${formatEur(result.pensionNetMonthly)} pension from age ${result.pensionStartAge}`
              : hasInflation
                ? `→ ${formatEur(result.lastMonthlyNet)} at age ${result.lifeExpectancy}`
                : "after tax"
          }
        />
        {showTotalIncomeTile && (
          <StatTile
            label="Total income (with pension)"
            value={`≈ ${formatEur(result.monthlyTotalIncomeWithPension)}`}
            accent="emerald"
            sub={`from age ${result.pensionStartAge} · ${formatEur(
              result.monthlyTotalIncomeWithPension - result.pensionNetMonthly,
            )} invest + ${formatEur(result.pensionNetMonthly)} pension`}
          />
        )}
        <StatTile
          label="Capital gains tax"
          value={formatEur(result.totalTax)}
          accent="amber"
          sub={
            result.totalWithdrawn > 0
              ? `≈ ${formatPercent(result.totalTax / result.totalWithdrawn)} of sales`
              : "over retirement"
          }
        />
        {isSpendDown ? (
          <StatTile
            label="Lifetime spending"
            value={formatEur(result.totalNet)}
            sub="net, after tax"
          />
        ) : (
          <StatTile
            label={lasts ? "Balance remaining" : "Runs out at"}
            value={
              lasts
                ? formatEur(result.finalBalance)
                : `age ${Math.floor(result.depletionAge ?? 0)}`
            }
            accent={lasts ? "emerald" : "amber"}
            sub={
              lasts
                ? `at age ${result.lifeExpectancy}`
                : `${formatDuration(result.depletionIntoRetirement)} into retirement`
            }
          />
        )}
      </div>

      <div
        className={`mt-4 rounded-lg px-4 py-3 text-sm ${
          isSpendDown || lasts
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        }`}
      >
        {isSpendDown ? (
          <>
            This is the most you can {isNet ? "spend" : "sell"} while still
            reaching age {result.lifeExpectancy} — the pot runs down to ≈€0 at
            the end, after ≈{formatEur(result.totalTax)} of capital-gains tax
            {hasInflation
              ? " and with spending keeping pace with inflation."
              : "."}
          </>
        ) : lasts ? (
          <>
            Your money lasts to age {result.lifeExpectancy}
            {result.finalBalance > 0 && (
              <>
                {" "}
                — with {formatEur(result.finalBalance)} still invested at the
                end.
              </>
            )}
          </>
        ) : (
          <>
            ⚠ The balance runs out around age{" "}
            {Math.floor(result.depletionAge ?? 0)} — about{" "}
            {formatDuration(result.depletionIntoRetirement)} into retirement.
            Try lowering the withdrawal, retiring later, or saving more.
          </>
        )}
      </div>
    </div>
  );
}
