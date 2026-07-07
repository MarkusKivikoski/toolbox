"use client";

import { useMemo } from "react";
import {
  calculateProjection,
  normalizeInput,
  DEFAULT_INPUT,
  EMPTY_INPUT,
  type ContributionPhase,
  type InvestingInput,
  type RetirementSettings,
} from "@/lib/investing";
import { usePersistedInvestingState } from "./hooks/usePersistedInvestingState";
import {
  NEW_PHASE_DEFAULT_CONTRIBUTION,
  NEW_PHASE_DEFAULT_YEARS,
} from "./constants";
import NumberField from "./components/NumberField";
import SavedCalculations from "./components/SavedCalculations";
import PhasesEditor from "./components/PhasesEditor";
import RetirementSection from "./components/RetirementSection";
import AdvancedSection from "./components/AdvancedSection";
import HeadlineCard from "./components/HeadlineCard";
import AccumulationStats from "./components/AccumulationStats";
import BalanceChart from "./components/BalanceChart";
import RetirementSummary from "./components/RetirementSummary";
import ExportPanel from "./components/ExportPanel";
import YearByYearTable from "./components/YearByYearTable";

export default function InvestingCalculator() {
  const { input, setInput, hydrated } = usePersistedInvestingState(DEFAULT_INPUT);

  const result = useMemo(() => calculateProjection(input), [input]);
  const showTodaysMoney = input.inflationPct > 0;

  // ---- mutation helpers ----
  const setField = <Key extends keyof InvestingInput>(
    key: Key,
    value: InvestingInput[Key],
  ) => setInput((previous) => ({ ...previous, [key]: value }));

  const patchRetirement = (patch: Partial<RetirementSettings>) =>
    setInput((previous) => ({
      ...previous,
      retirement: { ...previous.retirement, ...patch },
    }));

  const updatePhase = (id: string, patch: Partial<ContributionPhase>) =>
    setInput((previous) => ({
      ...previous,
      phases: previous.phases.map((phase) =>
        phase.id === id ? { ...phase, ...patch } : phase,
      ),
    }));

  const addPhase = () =>
    setInput((previous) => {
      const lastPhase = previous.phases[previous.phases.length - 1];
      // The current last phase becomes finite; the new one runs to retirement.
      const finitePhases = previous.phases.map((phase, index) =>
        index === previous.phases.length - 1
          ? { ...phase, years: phase.years > 0 ? phase.years : NEW_PHASE_DEFAULT_YEARS }
          : phase,
      );
      return {
        ...previous,
        phases: [
          ...finitePhases,
          {
            id: crypto.randomUUID(),
            years: NEW_PHASE_DEFAULT_YEARS,
            monthlyContribution: lastPhase
              ? lastPhase.monthlyContribution
              : NEW_PHASE_DEFAULT_CONTRIBUTION,
          },
        ],
      };
    });

  const removePhase = (id: string) =>
    setInput((previous) => ({
      ...previous,
      phases: previous.phases.filter((phase) => phase.id !== id),
    }));

  const resetToExample = () => setInput(DEFAULT_INPUT);

  const isRetirementAgeInvalid = result.retirementAge <= result.currentAge;
  const isLifeExpectancyInvalid = result.lifeExpectancy <= result.retirementAge;

  // Wait for the persisted draft to load so we never flash defaults over a
  // saved session.
  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <SavedCalculations
        current={input}
        onLoad={(loaded) => setInput(normalizeInput(loaded))}
        defaultInput={EMPTY_INPUT}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ---------- Form ---------- */}
        <section className="lg:col-span-5">
          <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                label="Starting balance"
                value={input.startingBalance}
                onChange={(startingBalance) =>
                  setField("startingBalance", startingBalance)
                }
                prefix="€"
              />
              <NumberField
                label="Expected yearly return"
                value={input.annualReturnPct}
                onChange={(annualReturnPct) =>
                  setField("annualReturnPct", annualReturnPct)
                }
                suffix="%"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Current age"
                value={input.currentAge}
                onChange={(age) => setField("currentAge", Math.round(age))}
              />
              <NumberField
                label="Retirement age"
                value={input.retirementAge}
                onChange={(age) => setField("retirementAge", Math.round(age))}
                hint={isRetirementAgeInvalid ? "Set above current age" : undefined}
                hintTone="warn"
              />
            </div>

            <PhasesEditor
              phases={input.phases}
              currentAge={result.currentAge}
              retirementAge={result.retirementAge}
              accumulationYears={result.accumulationYears}
              lastPhaseYears={result.lastPhaseYears}
              hasPhaseOverflow={result.phasesOverflow}
              onUpdatePhase={updatePhase}
              onAddPhase={addPhase}
              onRemovePhase={removePhase}
            />

            <RetirementSection
              retirement={input.retirement}
              result={result}
              lifeExpectancy={input.lifeExpectancy}
              hasInflation={showTodaysMoney}
              isLifeExpectancyInvalid={isLifeExpectancyInvalid}
              onPatch={patchRetirement}
              onSetLifeExpectancy={(age) => setField("lifeExpectancy", age)}
            />

            <AdvancedSection
              inflationPct={input.inflationPct}
              onChange={(inflationPct) => setField("inflationPct", inflationPct)}
            />

            <button
              type="button"
              onClick={resetToExample}
              className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
            >
              Reset to example
            </button>
          </div>
        </section>

        {/* ---------- Results ---------- */}
        <section className="space-y-5 lg:col-span-7">
          <HeadlineCard result={result} showTodaysMoney={showTodaysMoney} />

          <AccumulationStats result={result} />

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
            <BalanceChart
              points={result.points}
              accumulationYears={result.accumulationYears}
              showTodaysMoney={showTodaysMoney}
            />
          </div>

          {input.retirement.enabled && (
            <RetirementSummary result={result} input={input} />
          )}

          <ExportPanel result={result} input={input} />

          <YearByYearTable
            points={result.points}
            showTodaysMoney={showTodaysMoney}
          />
        </section>
      </div>
    </div>
  );
}
