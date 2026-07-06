import type { Dispatch, SetStateAction } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { normalizeInput, type InvestingInput } from "@/lib/investing";
import { DRAFT_STORAGE_KEY, LEGACY_DRAFT_STORAGE_KEY } from "../constants";

type PersistedInvestingState = {
  input: InvestingInput;
  setInput: Dispatch<SetStateAction<InvestingInput>>;
  hydrated: boolean;
};

const normalizeStoredInput = (stored: unknown): InvestingInput =>
  normalizeInput(stored as Partial<InvestingInput> | null);

const LEGACY_DRAFT = {
  storageKey: LEGACY_DRAFT_STORAGE_KEY,
  migrate: normalizeStoredInput,
};

/**
 * Hold the working draft in `localStorage` via the shared storage-backed
 * hook, still reading the pre-rename legacy key when no draft exists under
 * the current one. Every stored value is run through `normalizeInput`.
 */
export function usePersistedInvestingState(
  defaultInput: InvestingInput,
): PersistedInvestingState {
  const {
    value: input,
    setValue: setInput,
    hydrated,
  } = useLocalStorageState({
    storageKey: DRAFT_STORAGE_KEY,
    defaultValue: defaultInput,
    normalize: normalizeStoredInput,
    legacy: LEGACY_DRAFT,
  });
  return { input, setInput, hydrated };
}
