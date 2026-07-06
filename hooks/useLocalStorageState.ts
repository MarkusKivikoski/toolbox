import {
  useCallback,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  createLocalStorageStore,
  type StorageKeyOptions,
} from "@/lib/localStorageStore";

// One store for the whole app: every hook instance shares the per-key cache,
// so two components reading the same key always agree.
const browserStore = createLocalStorageStore(() =>
  typeof window === "undefined" ? null : window.localStorage,
);

// Lazy one-time registration flag for the cross-tab listener — set on the
// first subscription, when we know we're in a browser.
let isStorageListenerRegistered = false;

function ensureStorageListener(): void {
  if (isStorageListenerRegistered || typeof window === "undefined") return;
  isStorageListenerRegistered = true;
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== window.localStorage) return;
    browserStore.handleStorageEvent(event.key, event.newValue);
  });
}

const subscribeToNothing = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export type UseLocalStorageStateOptions<StoredValue> =
  StorageKeyOptions<StoredValue>;

type LocalStorageState<StoredValue> = {
  value: StoredValue;
  setValue: Dispatch<SetStateAction<StoredValue>>;
  /** False during prerender and the hydration render, true afterwards. */
  hydrated: boolean;
};

/**
 * Persistent state backed by `localStorage`, replacing the old two-effect
 * hydration-guard pattern. The prerender/hydration render sees `defaultValue`
 * (matching the static HTML); the first client render after hydration sees
 * the stored value. Writes happen synchronously in `setValue`, and edits in
 * other tabs propagate via the `storage` event.
 *
 * Contract: `storageKey`, `defaultValue`, `normalize`, and `legacy` must be
 * stable (module-level) values — `defaultValue` doubles as the server
 * snapshot and all of them key the setter's identity.
 */
export function useLocalStorageState<StoredValue>(
  options: UseLocalStorageStateOptions<StoredValue>,
): LocalStorageState<StoredValue> {
  const { storageKey, defaultValue, normalize, legacy } = options;

  const value = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        ensureStorageListener();
        return browserStore.subscribe(storageKey, onStoreChange);
      },
      [storageKey],
    ),
    () => browserStore.readValue({ storageKey, defaultValue, normalize, legacy }),
    () => defaultValue,
  );

  const setValue = useCallback<Dispatch<SetStateAction<StoredValue>>>(
    (next) =>
      browserStore.writeValue({ storageKey, defaultValue, normalize, legacy }, next),
    [storageKey, defaultValue, normalize, legacy],
  );

  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    clientSnapshot,
    serverSnapshot,
  );

  return { value, setValue, hydrated };
}
