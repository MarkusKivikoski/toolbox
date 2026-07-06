// React-free core of the shared localStorage state hook
// (hooks/useLocalStorageState.ts). Kept here so the caching, migration, and
// cross-tab invalidation logic is unit-testable in the node-env Vitest suite
// with an injected in-memory storage.
//
// The per-key cache is authoritative: `readValue` returns the same reference
// until something actually changes (a `useSyncExternalStore` requirement),
// and in-memory state keeps working even when `setItem` throws (private
// browsing, quota). localStorage itself is only re-read lazily after a
// cross-tab `storage` event invalidates the entry.

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type StorageKeyOptions<StoredValue> = {
  storageKey: string;
  /** Returned when nothing usable is stored. Must be a stable reference. */
  defaultValue: StoredValue;
  /** Validate/migrate raw parsed JSON. Throws are caught → `defaultValue`. */
  normalize: (stored: unknown) => StoredValue;
  /** Read (and migrate) from this key when the primary key is absent. */
  legacy?: {
    storageKey: string;
    migrate: (stored: unknown) => StoredValue;
  };
};

type CacheEntry = {
  /** The primary key's raw string at read time — compared against cross-tab events. */
  raw: string | null;
  value: unknown;
};

export type LocalStorageStore = ReturnType<typeof createLocalStorageStore>;

/**
 * `getStorageArea` is called lazily on every access (never at module import),
 * so the store is safe to create during prerender; return `null` where
 * storage doesn't exist.
 */
export function createLocalStorageStore(
  getStorageArea: () => StorageLike | null,
) {
  const cacheByKey = new Map<string, CacheEntry>();
  const listenersByKey = new Map<string, Set<() => void>>();

  const notify = (storageKey: string): void => {
    listenersByKey.get(storageKey)?.forEach((listener) => listener());
  };

  const readRaw = (storageKey: string): string | null => {
    try {
      return getStorageArea()?.getItem(storageKey) ?? null;
    } catch {
      return null;
    }
  };

  function readValue<StoredValue>(
    options: StorageKeyOptions<StoredValue>,
  ): StoredValue {
    const cached = cacheByKey.get(options.storageKey);
    if (cached) return cached.value as StoredValue;

    const raw = readRaw(options.storageKey);
    let value: StoredValue;
    try {
      if (raw !== null) {
        value = options.normalize(JSON.parse(raw));
      } else if (options.legacy) {
        const legacyRaw = readRaw(options.legacy.storageKey);
        value =
          legacyRaw !== null
            ? options.legacy.migrate(JSON.parse(legacyRaw))
            : options.defaultValue;
      } else {
        value = options.defaultValue;
      }
    } catch {
      value = options.defaultValue;
    }
    cacheByKey.set(options.storageKey, { raw, value });
    return value;
  }

  function writeValue<StoredValue>(
    options: StorageKeyOptions<StoredValue>,
    next: StoredValue | ((currentValue: StoredValue) => StoredValue),
  ): void {
    const currentValue = readValue(options);
    const value =
      typeof next === "function"
        ? (next as (currentValue: StoredValue) => StoredValue)(currentValue)
        : next;

    let raw: string | null = null;
    try {
      raw = JSON.stringify(value);
    } catch {
      /* unserializable value — keep it in memory only */
    }
    cacheByKey.set(options.storageKey, { raw, value });
    if (raw !== null) {
      try {
        getStorageArea()?.setItem(options.storageKey, raw);
      } catch {
        /* storage may be unavailable — the cache stays authoritative */
      }
    }
    notify(options.storageKey);
  }

  function subscribe(storageKey: string, listener: () => void): () => void {
    let listeners = listenersByKey.get(storageKey);
    if (!listeners) {
      listeners = new Set();
      listenersByKey.set(storageKey, listeners);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Apply a cross-tab `storage` event: drop stale cache entries and notify,
   * so the next read lazily re-parses the new raw value. An `eventKey` of
   * `null` means another tab called `clear()`.
   */
  function handleStorageEvent(
    eventKey: string | null,
    newValue: string | null,
  ): void {
    if (eventKey === null) {
      const cachedKeys = [...cacheByKey.keys()];
      cacheByKey.clear();
      cachedKeys.forEach(notify);
      return;
    }
    const entry = cacheByKey.get(eventKey);
    if (!entry || entry.raw === newValue) return;
    cacheByKey.delete(eventKey);
    notify(eventKey);
  }

  return { readValue, writeValue, subscribe, handleStorageEvent };
}
