import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  normalizeGuestListState,
  DEFAULT_GUEST_LIST_STATE,
  type GuestListState,
} from "@/lib/party-guest-list";
import { STORAGE_KEY } from "../constants";

const normalizeState = (stored: unknown): GuestListState =>
  normalizeGuestListState(stored, DEFAULT_GUEST_LIST_STATE);

/** Guest lists persisted in `localStorage` via the shared storage-backed hook. */
export function usePersistedGuestListState() {
  const {
    value: state,
    setValue: setState,
    hydrated,
  } = useLocalStorageState({
    storageKey: STORAGE_KEY,
    defaultValue: DEFAULT_GUEST_LIST_STATE,
    normalize: normalizeState,
  });
  return { state, setState, hydrated };
}
