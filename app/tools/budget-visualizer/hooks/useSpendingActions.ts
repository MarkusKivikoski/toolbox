import { useCallback, useMemo } from "react";
import type { PlanData } from "@/lib/budget";
import type { SpendingEntry } from "@/lib/budgetSpending";
import { newRowId } from "../utils";

/** The writes the legend can make against a section's spending log. */
export type SpendingActions = {
  /** Append a blank entry to the section's log and return its id. */
  addEntry: (sectionId: string) => string;
  updateEntry: (
    sectionId: string,
    entryId: string,
    patch: Partial<SpendingEntry>,
  ) => void;
  removeEntry: (sectionId: string, entryId: string) => void;
};

type PatchPlan = (update: (plan: PlanData) => PlanData) => void;

/**
 * Add, edit and remove the purchases logged against a section. Works through
 * the active plan's `patchPlan`, so edits land in whichever month is shown.
 */
export function useSpendingActions(patchPlan: PatchPlan): SpendingActions {
  const patchLog = useCallback(
    (sectionId: string, update: (entries: SpendingEntry[]) => SpendingEntry[]) =>
      patchPlan((plan) => ({
        ...plan,
        sections: plan.sections.map((section) =>
          section.id === sectionId
            ? { ...section, spending: update(section.spending ?? []) }
            : section,
        ),
      })),
    [patchPlan],
  );

  const addEntry = useCallback(
    (sectionId: string) => {
      const id = newRowId();
      patchLog(sectionId, (entries) => [...entries, { id, name: "", amount: "" }]);
      return id;
    },
    [patchLog],
  );

  const updateEntry = useCallback(
    (sectionId: string, entryId: string, patch: Partial<SpendingEntry>) =>
      patchLog(sectionId, (entries) =>
        entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
      ),
    [patchLog],
  );

  const removeEntry = useCallback(
    (sectionId: string, entryId: string) =>
      patchLog(sectionId, (entries) => entries.filter((entry) => entry.id !== entryId)),
    [patchLog],
  );

  return useMemo(
    () => ({ addEntry, updateEntry, removeEntry }),
    [addEntry, updateEntry, removeEntry],
  );
}
