import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  blankPlan,
  type BudgetRow,
  type BudgetState,
  type Mode,
  type PlanData,
  type SavingsState,
} from "@/lib/budget";
import { newRowId, reorderById } from "../utils";

/** Which list within a plan an action targets. */
export type RowField = "incomes" | "sections";

type Params = {
  setState: Dispatch<SetStateAction<BudgetState>>;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  setConfirmReset: Dispatch<SetStateAction<boolean>>;
  setFocusRowId: Dispatch<SetStateAction<string | null>>;
};

/**
 * All the writes against the budget state — row CRUD, savings edits, section
 * reordering, mode switching and reset. Each targets whichever plan is active.
 * Kept out of the component so the orchestrator is just wiring.
 */
export function useBudgetActions({
  setState,
  setActiveId,
  setConfirmReset,
  setFocusRowId,
}: Params) {
  const patchPlan = useCallback(
    (update: (plan: PlanData) => PlanData) =>
      setState((prev) => ({ ...prev, [prev.mode]: update(prev[prev.mode]) })),
    [setState],
  );

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
      setState((prev) => {
        const plan = prev[prev.mode];
        const next = reorderById(plan.sections, orderedIds);
        return next ? { ...prev, [prev.mode]: { ...plan, sections: next } } : prev;
      }),
    [setState],
  );

  const setMode = useCallback(
    (nextMode: Mode) => {
      setActiveId(null);
      setConfirmReset(false);
      setState((prev) => ({ ...prev, mode: nextMode }));
    },
    [setState, setActiveId, setConfirmReset],
  );

  const resetPlan = useCallback(() => {
    setActiveId(null);
    setState((prev) => ({ ...prev, [prev.mode]: blankPlan(prev.mode) }));
  }, [setState, setActiveId]);

  return {
    updateSavings,
    updateRow,
    addRow,
    removeRow,
    moveSection,
    reorderSections,
    setMode,
    resetPlan,
  };
}
