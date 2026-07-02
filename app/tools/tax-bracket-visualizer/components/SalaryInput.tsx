import { memo } from "react";
import { parseAmount } from "@/lib/utils";
import { COPY } from "../copy";
import { SALARY_SLIDER_MAX_EUR, SALARY_SLIDER_STEP_EUR } from "../constants";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Gross salary entry: a slider and a euro text field kept in sync. Typing past
 * the slider's range is allowed — the slider just pins at its max.
 */
function SalaryInput({ value, onChange }: Props) {
  const sliderValue = Math.min(parseAmount(value), SALARY_SLIDER_MAX_EUR);

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {COPY.salaryLabel}
        </span>
        <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="text-lg font-semibold text-zinc-400">€</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="0"
            aria-label={COPY.salaryLabel}
            className="w-full min-w-0 bg-transparent py-2.5 pl-2 text-lg font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
          <span className="pl-1 text-xs text-zinc-400">/yr</span>
        </div>
      </label>
      <input
        type="range"
        min={0}
        max={SALARY_SLIDER_MAX_EUR}
        step={SALARY_SLIDER_STEP_EUR}
        value={sliderValue}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${COPY.salaryLabel} slider`}
        className="mt-3 w-full accent-emerald-500"
      />
    </div>
  );
}

export default memo(SalaryInput);
