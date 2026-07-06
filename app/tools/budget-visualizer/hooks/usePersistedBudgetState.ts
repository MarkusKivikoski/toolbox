import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { normalizeState, type BudgetState } from "@/lib/budget";
import { DEFAULT_STATE } from "../copy";

const STORAGE_KEY = "toolbox.budget-visualizer.state.v1";

const normalizeBudgetState = (stored: unknown): BudgetState =>
  normalizeState(stored, DEFAULT_STATE);

/** Budget state persisted in `localStorage` via the shared storage-backed hook. */
export function usePersistedBudgetState() {
  const {
    value: state,
    setValue: setState,
    hydrated,
  } = useLocalStorageState({
    storageKey: STORAGE_KEY,
    defaultValue: DEFAULT_STATE,
    normalize: normalizeBudgetState,
  });
  return { state, setState, hydrated };
}
