"use client";

import { useCallback, useEffect, useState } from "react";
import {
  computeStatusPill,
  computeTripHeadline,
  parseAmount,
  type BudgetRow,
} from "@/lib/budget";
import { COPY, TONE } from "./copy";
import { RESET_CONFIRM_TIMEOUT_MS } from "./constants";
import { usePersistedBudgetState } from "./hooks/usePersistedBudgetState";
import { useBudgetActions } from "./hooks/useBudgetActions";
import { useBudgetProjections } from "./hooks/useBudgetProjections";
import { useSectionDragReorder } from "./hooks/useSectionDragReorder";
import ModeSwitch from "./components/ModeSwitch";
import IncomeSection from "./components/IncomeSection";
import EuroField from "./components/EuroField";
import CostsSection from "./components/CostsSection";
import SavingsInputs from "./components/SavingsInputs";
import ResetButton from "./components/ResetButton";
import BudgetDoughnut from "./components/BudgetDoughnut";
import BudgetLegend from "./components/BudgetLegend";
import SalarySavingsPanel from "./components/SalarySavingsPanel";
import TripSavingsPanel from "./components/TripSavingsPanel";

export default function BudgetVisualizer() {
  const { state, setState, hydrated } = usePersistedBudgetState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const clearFocusRow = useCallback(() => setFocusRowId(null), []);
  const clearActive = useCallback(() => setActiveId(null), []);

  const mode = state.mode;
  const copy = COPY[mode];
  const { incomes, sections, savings } = state[mode];

  const { summary, salaryProj, tripProj } = useBudgetProjections(mode, state[mode]);
  const {
    updateSavings,
    updateRow,
    addRow,
    removeRow,
    moveSection,
    reorderSections,
    setMode,
    resetPlan,
  } = useBudgetActions({ setState, setActiveId, setConfirmReset, setFocusRowId });

  const { listRef, dragId, startDrag } = useSectionDragReorder({
    onReorder: reorderSections,
    onDragStart: clearActive,
  });

  // Auto-cancel the reset confirmation if it isn't taken.
  useEffect(() => {
    if (!confirmReset) return;
    const timer = window.setTimeout(
      () => setConfirmReset(false),
      RESET_CONFIRM_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [confirmReset]);

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    resetPlan();
  }, [confirmReset, resetPlan]);

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  const { remaining, allocated, overBudget, slices, income } = summary;
  const perMonthNum = parseAmount(savings.perMonth);
  const monthsUntil = Math.max(0, Math.floor(parseAmount(savings.monthsUntilTrip)));
  const statusPill = computeStatusPill({
    mode,
    allocated,
    income,
    overBudget,
    remaining,
    savingsEnabled: savings.enabled,
  });
  const tripHeadline = computeTripHeadline(tripProj, perMonthNum);
  const tripBudgetRow = incomes[0] as BudgetRow | undefined;

  return (
    <div className="space-y-5">
      {/* Form: mode switch + budget/costs + savings */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <ModeSwitch mode={mode} onModeChange={setMode} />

        {mode === "salary" ? (
          <IncomeSection
            heading={copy.incomeHeading}
            incomes={incomes}
            totalIncome={income}
            focusRowId={focusRowId}
            onAutoFocused={clearFocusRow}
            onName={(id, value) => updateRow("incomes", id, { name: value })}
            onAmount={(id, value) => updateRow("incomes", id, { amount: value })}
            onRemove={(id) => removeRow("incomes", id)}
            onAdd={() => addRow("incomes")}
          />
        ) : (
          <EuroField
            label="Trip budget (optional)"
            value={tripBudgetRow?.amount ?? ""}
            onChange={(value) =>
              tripBudgetRow &&
              updateRow("incomes", tripBudgetRow.id, { amount: value })
            }
            ariaLabel="Trip budget"
          />
        )}

        <CostsSection
          copy={copy}
          sections={sections}
          listRef={listRef}
          dragId={dragId}
          focusRowId={focusRowId}
          onAutoFocused={clearFocusRow}
          onName={(id, value) => updateRow("sections", id, { name: value })}
          onAmount={(id, value) => updateRow("sections", id, { amount: value })}
          onRemove={(id) => removeRow("sections", id)}
          onAdd={() => addRow("sections")}
          onActiveChange={setActiveId}
          onDragPointerDown={startDrag}
          onMoveSection={moveSection}
        />

        <SavingsInputs mode={mode} savings={savings} onChange={updateSavings} />

        <ResetButton mode={mode} confirmReset={confirmReset} onReset={handleReset} />
      </div>

      {/* Visualization: doughnut + legend + savings projection */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <BudgetDoughnut
          slices={slices}
          allocated={allocated}
          overBudget={overBudget}
          totalLabel={copy.doughnutCenter}
          subLabel={copy.doughnutSub}
          activeId={activeId}
          onActiveChange={setActiveId}
        />

        <div
          className={`mx-auto mt-4 max-w-xs rounded-xl border px-4 py-2.5 text-center text-sm font-medium ${TONE[statusPill.tone]}`}
        >
          {statusPill.text}
        </div>

        <BudgetLegend
          slices={slices}
          income={income}
          allocated={allocated}
          allocatedLabel={copy.allocatedLabel}
          emptyMessage={copy.emptyDoughnut}
          activeId={activeId}
          onActiveChange={setActiveId}
        />

        {savings.enabled && mode === "salary" && (
          <SalarySavingsPanel proj={salaryProj} />
        )}
        {savings.enabled && mode === "trip" && (
          <TripSavingsPanel
            proj={tripProj}
            headline={tripHeadline}
            perMonth={perMonthNum}
            monthsUntil={monthsUntil}
          />
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Everything stays in your browser — nothing is uploaded. Switch between a
        monthly budget and a trip; each keeps its own figures.
      </p>
    </div>
  );
}
