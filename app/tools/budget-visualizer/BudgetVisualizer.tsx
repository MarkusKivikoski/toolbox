"use client";

import { useCallback, useState } from "react";
import { selectPlan, sourceMonthFor, type BudgetRow } from "@/lib/budget";
import { COPY, EXAMPLE_MONTH_PLAN } from "./copy";
import { EMPTY_PLAN } from "./constants";
import { currentMonthKey, formatMonthLabel } from "./utils";
import { usePersistedBudgetState } from "./hooks/usePersistedBudgetState";
import { useBudgetActions } from "./hooks/useBudgetActions";
import { useBudgetProjections } from "./hooks/useBudgetProjections";
import { useSectionDragReorder } from "./hooks/useSectionDragReorder";
import { useResetConfirm } from "./hooks/useResetConfirm";
import ModeSwitch from "./components/ModeSwitch";
import MonthSwitcher from "./components/MonthSwitcher";
import EmptyMonthPrompt from "./components/EmptyMonthPrompt";
import IncomeSection from "./components/IncomeSection";
import EuroField from "./components/EuroField";
import CostsSection from "./components/CostsSection";
import SavingsInputs from "./components/SavingsInputs";
import ResetButton from "./components/ResetButton";
import BudgetResults from "./components/BudgetResults";

export default function BudgetVisualizer() {
  const { state, setState, hydrated } = usePersistedBudgetState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonthKey);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const { isArmed: confirmReset, arm: armReset, disarm: cancelReset } = useResetConfirm();
  const clearFocusRow = useCallback(() => setFocusRowId(null), []);
  const clearActive = useCallback(() => setActiveId(null), []);

  const mode = state.mode;
  const copy = COPY[mode];
  // null = a monthly budget for a month that hasn't been started yet.
  const selectedPlan = selectPlan(state, month);
  const { incomes, sections, savings } = selectedPlan ?? EMPTY_PLAN;
  const startedMonths = Object.keys(state.months);
  const sourceMonth = sourceMonthFor(startedMonths, month);

  const { summary, salaryProj, tripProj } = useBudgetProjections(
    mode,
    selectedPlan ?? EMPTY_PLAN,
  );
  const {
    updateSavings,
    updateRow,
    addRow,
    removeRow,
    moveSection,
    reorderSections,
    setMode,
    startMonth,
    resetPlan,
    togglePaid,
    clearAllPaid,
  } = useBudgetActions({
    month,
    examplePlan: EXAMPLE_MONTH_PLAN,
    setState,
    setActiveId,
    onCancelReset: cancelReset,
    setFocusRowId,
  });

  const { listRef, dragId, startDrag } = useSectionDragReorder({
    onReorder: reorderSections,
    onDragStart: clearActive,
  });

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      armReset();
      return;
    }
    cancelReset();
    resetPlan();
  }, [confirmReset, armReset, cancelReset, resetPlan]);

  const handleMonthChange = useCallback(
    (nextMonth: string) => {
      setActiveId(null);
      cancelReset();
      setMonth(nextMonth);
    },
    [cancelReset],
  );

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Ladataan…</div>;
  }

  const tripBudgetRow = incomes[0] as BudgetRow | undefined;

  return (
    <div className="space-y-5">
      {/* Form: mode switch + month + budget/costs + savings */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <ModeSwitch mode={mode} onModeChange={setMode} />

        {mode === "salary" && (
          <MonthSwitcher
            month={month}
            startedMonths={startedMonths}
            onMonthChange={handleMonthChange}
          />
        )}

        {selectedPlan === null ? (
          <EmptyMonthPrompt
            sourceMonthLabel={sourceMonth ? formatMonthLabel(sourceMonth) : null}
            onStart={startMonth}
          />
        ) : (
          <>
            {mode === "salary" ? (
              <IncomeSection
                heading={copy.incomeHeading}
                incomes={incomes}
                totalIncome={summary.income}
                focusRowId={focusRowId}
                onAutoFocused={clearFocusRow}
                onName={(id, value) => updateRow("incomes", id, { name: value })}
                onAmount={(id, value) => updateRow("incomes", id, { amount: value })}
                onRemove={(id) => removeRow("incomes", id)}
                onAdd={() => addRow("incomes")}
              />
            ) : (
              <EuroField
                label="Matkabudjetti (valinnainen)"
                value={tripBudgetRow?.amount ?? ""}
                onChange={(value) =>
                  tripBudgetRow &&
                  updateRow("incomes", tripBudgetRow.id, { amount: value })
                }
                ariaLabel="Matkabudjetti"
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
          </>
        )}
      </div>

      {selectedPlan !== null && (
        <BudgetResults
          mode={mode}
          summary={summary}
          savings={savings}
          salaryProj={salaryProj}
          tripProj={tripProj}
          activeId={activeId}
          onActiveChange={setActiveId}
          onTogglePaid={togglePaid}
          onClearPaid={clearAllPaid}
        />
      )}

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Kaikki pysyy selaimessasi — mitään ei lähetetä minnekään. Voit vaihtaa
        kuukausibudjetin ja matkan välillä; kummallakin on omat lukunsa.
      </p>
    </div>
  );
}
