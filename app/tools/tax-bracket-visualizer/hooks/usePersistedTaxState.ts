import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { normalizeTaxToolState, type TaxToolState } from "@/lib/tax-bracket-visualizer";
import { DEFAULT_STATE } from "../constants";

const STORAGE_KEY = "toolbox.tax-bracket-visualizer.state.v1";

const normalizeStoredTaxState = (stored: unknown): TaxToolState =>
  normalizeTaxToolState(stored, DEFAULT_STATE);

/** Tax tool inputs persisted in `localStorage` via the shared storage-backed hook. */
export function usePersistedTaxState() {
  const {
    value: state,
    setValue: setState,
    hydrated,
  } = useLocalStorageState({
    storageKey: STORAGE_KEY,
    defaultValue: DEFAULT_STATE,
    normalize: normalizeStoredTaxState,
  });
  return { state, setState, hydrated };
}
