"use client";

import { useMemo, useState } from "react";
import {
  computeGrossAllocation,
  computeRaiseImpact,
  computeTaxBreakdown,
  municipalRateForState,
  type TaxToolState,
} from "@/lib/tax-bracket-visualizer";
import { parseAmount } from "@/lib/utils";
import { usePersistedTaxState } from "./hooks/usePersistedTaxState";
import { COPY } from "./copy";
import SalaryInput from "./components/SalaryInput";
import MunicipalitySelect from "./components/MunicipalitySelect";
import TaxBar from "./components/TaxBar";
import BarCaption from "./components/BarCaption";
import ResultsPanel from "./components/ResultsPanel";
import RaiseImpactPanel from "./components/RaiseImpactPanel";

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6";

export default function TaxBracketVisualizer() {
  const { state, setState, hydrated } = usePersistedTaxState();
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const municipalRatePercent = municipalRateForState(state);
  const grossAnnualIncome = parseAmount(state.grossAnnualIncome);

  const breakdown = useMemo(
    () => computeTaxBreakdown(grossAnnualIncome, municipalRatePercent),
    [grossAnnualIncome, municipalRatePercent],
  );
  const segments = useMemo(() => computeGrossAllocation(breakdown), [breakdown]);

  const raiseAmount = parseAmount(state.raiseAmount);
  const raiseImpact = useMemo(
    () =>
      raiseAmount > 0
        ? computeRaiseImpact(grossAnnualIncome, raiseAmount, municipalRatePercent)
        : null,
    [grossAnnualIncome, raiseAmount, municipalRatePercent],
  );

  const activeSegment =
    segments.find((segment) => segment.id === activeSegmentId) ?? null;

  const update = (patch: Partial<TaxToolState>) =>
    setState((previous) => ({ ...previous, ...patch }));

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <section className={card}>
        <div className="space-y-4">
          <SalaryInput
            value={state.grossAnnualIncome}
            onChange={(value) => update({ grossAnnualIncome: value })}
          />
          <MunicipalitySelect
            municipalityId={state.municipalityId}
            customRatePercent={state.customRatePercent}
            onMunicipalityChange={(municipalityId) => update({ municipalityId })}
            onCustomRateChange={(ratePercent) => update({ customRatePercent: ratePercent })}
          />
        </div>
      </section>

      <section className={card}>
        <TaxBar
          segments={segments}
          activeId={activeSegmentId}
          onActiveChange={setActiveSegmentId}
        />
        <BarCaption segments={segments} activeSegment={activeSegment} />
        <div className="mt-4">
          <ResultsPanel breakdown={breakdown} />
        </div>
        <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <RaiseImpactPanel
            raiseAmount={state.raiseAmount}
            onRaiseAmountChange={(value) => update({ raiseAmount: value })}
            impact={raiseImpact}
          />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          {COPY.disclaimer}
        </p>
      </section>
    </div>
  );
}
