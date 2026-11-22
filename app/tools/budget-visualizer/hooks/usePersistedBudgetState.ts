import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  migrateLegacyState,
  normalizeState,
  type BudgetState,
} from "@/lib/budget";
import { DEFAULT_STATE, LEGACY_FALLBACK } from "../copy";
import { currentMonthKey } from "../utils";

const STORAGE_KEY = "toolbox.budget-visualizer.state.v2";
const LEGACY_STORAGE_KEY = "toolbox.budget-visualizer.state.v1";

const normalizeBudgetState = (stored: unknown): BudgetState =>
  normalizeState(stored, DEFAULT_STATE);

// v1 had one undated salary plan; it becomes the current month's budget.
const migrateLegacyBudgetState = (stored: unknown): BudgetState =>
  migrateLegacyState(stored, LEGACY_FALLBACK, currentMonthKey());

const LEGACY = {
  storageKey: LEGACY_STORAGE_KEY,
  migrate: migrateLegacyBudgetState,
};

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
    legacy: LEGACY,
  });
  return { state, setState, hydrated };
}
