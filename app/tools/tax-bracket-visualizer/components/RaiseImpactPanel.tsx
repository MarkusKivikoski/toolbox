import { memo } from "react";
import { formatEur, formatPercent } from "@/lib/format";
import type { RaiseImpact } from "@/lib/tax-bracket-visualizer";
import { COPY } from "../copy";

type Props = {
  raiseAmount: string;
  onRaiseAmountChange: (value: string) => void;
  /** Null until a positive raise amount is entered. */
  impact: RaiseImpact | null;
};

const KEPT_COLOR = "#10b981"; // emerald — matches the bar's net segment
const TAXED_COLOR = "#f43f5e"; // rose

/** The "what does a raise actually leave in hand" panel. */
function RaiseImpactPanel({ raiseAmount, onRaiseAmountChange, impact }: Props) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{COPY.raiseHeading}</h2>
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-400">€</span>
        <input
          type="text"
          inputMode="decimal"
          value={raiseAmount}
          onChange={(event) => onRaiseAmountChange(event.target.value)}
          placeholder="5000"
          aria-label={COPY.raiseInputLabel}
          className="w-full min-w-0 bg-transparent py-2.5 pl-1 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
      {impact && (
        <div className="mt-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You keep{" "}
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatEur(impact.extraNet)}
            </span>{" "}
            ({formatPercent(impact.keptShare)}) —{" "}
            <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {formatEur(impact.extraTax)}
            </span>{" "}
            ({formatPercent(impact.taxShare)}) goes to tax
          </p>
          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full">
            <div
              style={{ width: `${impact.keptShare * 100}%`, backgroundColor: KEPT_COLOR }}
            />
            <div
              style={{ width: `${impact.taxShare * 100}%`, backgroundColor: TAXED_COLOR }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RaiseImpactPanel);
