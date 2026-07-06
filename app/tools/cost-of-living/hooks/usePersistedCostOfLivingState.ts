import type { Dispatch, SetStateAction } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  DEFAULT_STATE,
  fromLegacy,
  normalizeState,
  type State,
} from "@/lib/cost-of-living";

const STATE_STORAGE_KEY = "toolbox.cost-of-living.state.v2";
/** The v1 shape (single amount + year pair) — migrated on read via `fromLegacy`. */
const LEGACY_STATE_STORAGE_KEY = "toolbox.cost-of-living.state.v1";

type PersistedCostOfLivingState = {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
  hydrated: boolean;
};

const LEGACY_STATE = {
  storageKey: LEGACY_STATE_STORAGE_KEY,
  migrate: fromLegacy,
};

/** Comparison state persisted in `localStorage` via the shared storage-backed hook. */
export function usePersistedCostOfLivingState(): PersistedCostOfLivingState {
  const {
    value: state,
    setValue: setState,
    hydrated,
  } = useLocalStorageState({
    storageKey: STATE_STORAGE_KEY,
    defaultValue: DEFAULT_STATE,
    normalize: normalizeState,
    legacy: LEGACY_STATE,
  });
  return { state, setState, hydrated };
}
