import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  applyPlanUpdate,
  blankMonthPlan,
  blankPlan,
  carryLeftoverIntoSavings,
  clearPaid,
  copyMonthPlan,
  sourceMonthFor,
  type BudgetRow,
  type BudgetState,
  type MonthKey,
  type MonthPlan,
  type Mode,
  type PlanData,
  type SavingsState,
} from "@/lib/budget";
import { newRowId, reorderById } from "../utils";
import { useSpendingActions } from "./useSpendingActions";

/** Which list within a plan an action targets. */
export type RowField = "incomes" | "sections";

/** Where a newly started month's lines come from. */
export type MonthSource = "previous" | "example" | "blank";

type Params = {
  /** The month shown in monthly mode; edits to the salary plan land here. */
  month: MonthKey;
  /** The ready-made budget used when a month is started from the example. */
  examplePlan: MonthPlan;
  setState: Dispatch<SetStateAction<BudgetState>>;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  onCancelReset: () => void;
  setFocusRowId: Dispatch<SetStateAction<string | null>>;
};

/**
 * All the writes against the budget state — row CRUD, savings edits, section
 * reordering, mode switching, month creation and reset. Each targets whichever
 * plan is active. Kept out of the component so the orchestrator is just wiring.
 */
export function useBudgetActions({
  month,
  examplePlan,
  setState,
  setActiveId,
  onCancelReset,
  setFocusRowId,
}: Params) {
  const patchPlan = useCallback(
    (update: (plan: PlanData) => PlanData) =>
      setState((prev) => applyPlanUpdate(prev, month, update)),
    [setState, month],
  );

  const spendingActions = useSpendingActions(patchPlan);

  const updateSavings = useCallback(
    (patch: Partial<SavingsState>) =>
      patchPlan((plan) => ({ ...plan, savings: { ...plan.savings, ...patch } })),
    [patchPlan],
  );

  const updateRow = useCallback(
    (field: RowField, id: string, patch: Partial<BudgetRow>) =>
      patchPlan((plan) => ({
        ...plan,
        [field]: plan[field].map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      })),
    [patchPlan],
  );

  const addRow = useCallback(
    (field: RowField) => {
      const id = newRowId();
      patchPlan((plan) => ({
        ...plan,
        [field]: [...plan[field], { id, name: "", amount: "" }],
      }));
      setFocusRowId(id); // focus the new row's name input once it renders
    },
    [patchPlan, setFocusRowId],
  );

  const removeRow = useCallback(
    (field: RowField, id: string) => {
      setActiveId((current) => (current === id ? null : current));
      patchPlan((plan) => ({
        ...plan,
        [field]: plan[field].filter((row) => row.id !== id),
      }));
    },
    [patchPlan, setActiveId],
  );

  const moveSection = useCallback(
    (from: number, to: number) =>
      patchPlan((plan) => {
        if (to < 0 || to >= plan.sections.length || from === to) return plan;
        const next = plan.sections.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...plan, sections: next };
      }),
    [patchPlan],
  );

  // Stable so the drag hook doesn't re-bind its window listeners mid-drag.
  const reorderSections = useCallback(
    (orderedIds: string[]) =>
      setState((prev) =>
        applyPlanUpdate(prev, month, (plan) => {
          const next = reorderById(plan.sections, orderedIds);
          return next ? { ...plan, sections: next } : plan;
        }),
      ),
    [setState, month],
  );

  const setMode = useCallback(
    (nextMode: Mode) => {
      setActiveId(null);
      onCancelReset();
      setState((prev) => ({ ...prev, mode: nextMode }));
    },
    [setState, setActiveId, onCancelReset],
  );

  const togglePaid = useCallback(
    (id: string) =>
      patchPlan((plan) => ({
        ...plan,
        sections: plan.sections.map((row) =>
          row.id === id ? { ...row, isPaid: row.isPaid !== true } : row,
        ),
      })),
    [patchPlan],
  );

  const clearAllPaid = useCallback(() => patchPlan(clearPaid), [patchPlan]);

  const startMonth = useCallback(
    (source: MonthSource) =>
      setState((prev) => {
        const sourceKey = sourceMonthFor(Object.keys(prev.months), month);
        const sourcePlan = sourceKey ? prev.months[sourceKey] : null;
        const plan =
          source === "previous" && sourcePlan
            ? copyMonthPlan(sourcePlan)
            : source === "example"
              ? copyMonthPlan(examplePlan)
              : blankMonthPlan();
        // Moving on from an earlier month: what it left over joins the savings.
        const isMovingForward = sourceKey !== null && sourceKey < month;
        const salarySavings =
          isMovingForward && sourcePlan && source !== "example"
            ? carryLeftoverIntoSavings(prev.salarySavings, sourcePlan)
            : prev.salarySavings;
        return { ...prev, salarySavings, months: { ...prev.months, [month]: plan } };
      }),
    [setState, month, examplePlan],
  );

  // Clears the lines but keeps the shared savings goal.
  const resetPlan = useCallback(() => {
    setActiveId(null);
    setState((prev) =>
      applyPlanUpdate(prev, month, (plan) => {
        const blank = blankPlan(prev.mode);
        return prev.mode === "salary" ? { ...blank, savings: plan.savings } : blank;
      }),
    );
  }, [setState, setActiveId, month]);

  return {
    updateSavings,
    updateRow,
    addRow,
    removeRow,
    moveSection,
    reorderSections,
    setMode,
    togglePaid,
    clearAllPaid,
    spendingActions,
    startMonth,
    resetPlan,
  };
}
