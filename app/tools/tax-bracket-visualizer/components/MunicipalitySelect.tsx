import { memo } from "react";
import { formatPercent } from "@/lib/format";
import {
  CUSTOM_MUNICIPALITY_ID,
  CUSTOM_RATE_MAX_PERCENT,
  CUSTOM_RATE_MIN_PERCENT,
  CUSTOM_RATE_STEP_PERCENT,
  MUNICIPALITIES,
} from "@/lib/tax-bracket-visualizer.config";
import { COPY } from "../copy";

type Props = {
  municipalityId: string;
  customRatePercent: number;
  onMunicipalityChange: (municipalityId: string) => void;
  onCustomRateChange: (ratePercent: number) => void;
};

const ratePercentLabel = (ratePercent: number) =>
  formatPercent(ratePercent / 100, { maximumFractionDigits: 1, locale: "fi-FI" });

/**
 * Municipality picker: curated big cities with their 2026 rates, plus a
 * "Custom rate" option that reveals a manual rate slider.
 */
function MunicipalitySelect({
  municipalityId,
  customRatePercent,
  onMunicipalityChange,
  onCustomRateChange,
}: Props) {
  const isCustom = municipalityId === CUSTOM_MUNICIPALITY_ID;

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {COPY.municipalityLabel}
        </span>
        <select
          value={municipalityId}
          onChange={(event) => onMunicipalityChange(event.target.value)}
          aria-label={COPY.municipalityLabel}
          className="w-full rounded-xl border border-zinc-300 bg-white px-2 py-2.5 text-base font-medium tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
        >
          {MUNICIPALITIES.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>
              {municipality.name} — {ratePercentLabel(municipality.ratePercent)}
            </option>
          ))}
          <option value={CUSTOM_MUNICIPALITY_ID}>{COPY.customMunicipalityOption}</option>
        </select>
      </label>
      {isCustom && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {COPY.customRateLabel}
            </span>
            <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {ratePercentLabel(customRatePercent)}
            </span>
          </div>
          <input
            type="range"
            min={CUSTOM_RATE_MIN_PERCENT}
            max={CUSTOM_RATE_MAX_PERCENT}
            step={CUSTOM_RATE_STEP_PERCENT}
            value={customRatePercent}
            onChange={(event) => onCustomRateChange(Number(event.target.value))}
            aria-label={COPY.customRateLabel}
            className="w-full accent-emerald-500"
          />
        </div>
      )}
    </div>
  );
}

export default memo(MunicipalitySelect);
