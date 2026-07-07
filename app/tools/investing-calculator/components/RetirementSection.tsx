import type { InvestingResult, RetirementSettings } from "@/lib/investing";
import { formatEur } from "@/lib/format";
import { AMOUNT_BASIS_OPTIONS, WITHDRAWAL_MODE_OPTIONS } from "../constants";
import NumberField from "./NumberField";
import SegmentedToggle from "./SegmentedToggle";
import PensionFields from "./PensionFields";

type RetirementSectionProps = {
  retirement: RetirementSettings;
  result: InvestingResult;
  lifeExpectancy: number;
  hasInflation: boolean;
  isLifeExpectancyInvalid: boolean;
  onPatch: (patch: Partial<RetirementSettings>) => void;
  onSetLifeExpectancy: (age: number) => void;
};

/** The retirement drawdown form: enable toggle, mode/basis, amounts, tax. */
export default function RetirementSection({
  retirement,
  result,
  lifeExpectancy,
  hasInflation,
  isLifeExpectancyInvalid,
  onPatch,
  onSetLifeExpectancy,
}: RetirementSectionProps) {
  const isNet = retirement.basis === "net";

  return (
    <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Model retirement drawdown
        </span>
        <input
          type="checkbox"
          checked={retirement.enabled}
          onChange={(event) => onPatch({ enabled: event.target.checked })}
          className="h-5 w-5 flex-shrink-0 accent-emerald-500"
        />
      </label>

      {retirement.enabled && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SegmentedToggle
              label="How to withdraw"
              options={WITHDRAWAL_MODE_OPTIONS}
              value={retirement.mode}
              onChange={(mode) => onPatch({ mode })}
            />
            <SegmentedToggle
              label="Amount basis"
              options={AMOUNT_BASIS_OPTIONS}
              value={retirement.basis}
              onChange={(basis) => onPatch({ basis })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {retirement.mode === "fixed" ? (
              <NumberField
                label={isNet ? "Spend / month (net)" : "Sell / month (gross)"}
                value={retirement.monthlyWithdrawal}
                onChange={(monthlyWithdrawal) => onPatch({ monthlyWithdrawal })}
                prefix="€"
              />
            ) : (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  You can {isNet ? "spend" : "sell"}
                </span>
                <div className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 sm:py-2">
                  ≈{" "}
                  {formatEur(
                    isNet ? result.firstMonthlyNet : result.firstMonthlyGross,
                  )}
                  /mo {isNet ? "net" : "gross"}
                </div>
                <span className="mt-1 block text-xs text-zinc-400">
                  {isNet
                    ? `selling ≈ ${formatEur(result.firstMonthlyGross)} gross`
                    : `≈ ${formatEur(result.firstMonthlyNet)} net after tax`}
                  {hasInflation ? ", rising with inflation" : ""}
                </span>
              </div>
            )}
            <NumberField
              label="Life expectancy"
              value={lifeExpectancy}
              onChange={(age) => onSetLifeExpectancy(Math.round(age))}
              hint={
                isLifeExpectancyInvalid
                  ? "Set above retirement age"
                  : `Drawdown lasts ${result.retirementYears} yr`
              }
              hintTone={isLifeExpectancyInvalid ? "warn" : "muted"}
            />
            <NumberField
              label="Return while retired"
              value={retirement.annualReturnPct}
              onChange={(annualReturnPct) => onPatch({ annualReturnPct })}
              suffix="%"
              hint="Often lower / safer than while saving."
            />
            <NumberField
              label="Capital gains tax"
              value={retirement.capitalGainsTaxPct}
              onChange={(capitalGainsTaxPct) => onPatch({ capitalGainsTaxPct })}
              suffix="%"
              hint="Finland: 30%"
            />
          </div>

          <label className="flex cursor-pointer items-start justify-between gap-3 py-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Apply hankintameno-olettama
              <span className="mt-0.5 block text-xs text-zinc-400">
                Finnish presumed acquisition cost — taxes at most 60% of a sale
                (assumes holdings of 10+ years).
              </span>
            </span>
            <input
              type="checkbox"
              checked={retirement.usePresumedCost}
              onChange={(event) =>
                onPatch({ usePresumedCost: event.target.checked })
              }
              className="mt-0.5 h-5 w-5 flex-shrink-0 accent-emerald-500"
            />
          </label>

          <PensionFields retirement={retirement} onPatch={onPatch} />
        </div>
      )}
    </div>
  );
}
