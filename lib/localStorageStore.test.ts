import { describe, it, expect, vi } from "vitest";
import {
  createLocalStorageStore,
  type StorageKeyOptions,
  type StorageLike,
} from "@/lib/localStorageStore";

type FakeStorage = StorageLike & { entries: Map<string, string> };

const createFakeStorage = (
  initial: Record<string, string> = {},
): FakeStorage => {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
};

type Settings = { theme: string };

const DEFAULT_SETTINGS: Settings = { theme: "light" };

const normalizeSettings = (stored: unknown): Settings => {
  const source = (
    typeof stored === "object" && stored !== null ? stored : {}
  ) as Partial<Settings>;
  return {
    theme: typeof source.theme === "string" ? source.theme : DEFAULT_SETTINGS.theme,
  };
};

const settingsOptions: StorageKeyOptions<Settings> = {
  storageKey: "toolbox.test.settings.v2",
  defaultValue: DEFAULT_SETTINGS,
  normalize: normalizeSettings,
};

describe("readValue", () => {
  it("returns the default when nothing is stored", () => {
    const store = createLocalStorageStore(() => createFakeStorage());
    expect(store.readValue(settingsOptions)).toBe(DEFAULT_SETTINGS);
  });

  it("parses and normalizes a stored value", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark", junk: 1 }),
    });
    const store = createLocalStorageStore(() => storage);
    expect(store.readValue(settingsOptions)).toEqual({ theme: "dark" });
  });

  it("falls back to the default for malformed JSON", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: "{not json",
    });
    const store = createLocalStorageStore(() => storage);
    expect(store.readValue(settingsOptions)).toBe(DEFAULT_SETTINGS);
  });

  it("falls back to the default when normalize throws", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark" }),
    });
    const store = createLocalStorageStore(() => storage);
    const throwingOptions: StorageKeyOptions<Settings> = {
      ...settingsOptions,
      normalize: () => {
        throw new Error("bad shape");
      },
    };
    expect(store.readValue(throwingOptions)).toBe(DEFAULT_SETTINGS);
  });

  it("returns a referentially stable value across repeated reads", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark" }),
    });
    const store = createLocalStorageStore(() => storage);
    expect(store.readValue(settingsOptions)).toBe(store.readValue(settingsOptions));
  });

  it("returns the default when the storage area is unavailable", () => {
    const store = createLocalStorageStore(() => null);
    expect(store.readValue(settingsOptions)).toBe(DEFAULT_SETTINGS);
  });
});

describe("legacy fallback", () => {
  const legacyOptions: StorageKeyOptions<Settings> = {
    ...settingsOptions,
    legacy: {
      storageKey: "toolbox.test.settings.v1",
      migrate: (stored) => ({
        theme: `migrated-${(stored as { colour: string }).colour}`,
      }),
    },
  };

  it("migrates from the legacy key when the primary is absent", () => {
    const storage = createFakeStorage({
      "toolbox.test.settings.v1": JSON.stringify({ colour: "dark" }),
    });
    const store = createLocalStorageStore(() => storage);
    expect(store.readValue(legacyOptions)).toEqual({ theme: "migrated-dark" });
  });

  it("prefers the primary key when both are present", () => {
    const storage = createFakeStorage({
      "toolbox.test.settings.v1": JSON.stringify({ colour: "dark" }),
      [settingsOptions.storageKey]: JSON.stringify({ theme: "primary" }),
    });
    const store = createLocalStorageStore(() => storage);
    expect(store.readValue(legacyOptions)).toEqual({ theme: "primary" });
  });
});

describe("writeValue", () => {
  it("persists, updates the cache, and notifies listeners", () => {
    const storage = createFakeStorage();
    const store = createLocalStorageStore(() => storage);
    const listener = vi.fn();
    store.subscribe(settingsOptions.storageKey, listener);

    store.writeValue(settingsOptions, { theme: "dark" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(storage.entries.get(settingsOptions.storageKey)).toBe(
      JSON.stringify({ theme: "dark" }),
    );
    expect(store.readValue(settingsOptions)).toEqual({ theme: "dark" });
  });

  it("resolves updater functions against the current value", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark" }),
    });
    const store = createLocalStorageStore(() => storage);

    store.writeValue(settingsOptions, (current) => ({
      theme: `${current.theme}-updated`,
    }));

    expect(store.readValue(settingsOptions)).toEqual({ theme: "dark-updated" });
  });

  it("keeps the in-memory value authoritative when setItem throws", () => {
    const storage = createFakeStorage();
    storage.setItem = () => {
      throw new Error("quota exceeded");
    };
    const store = createLocalStorageStore(() => storage);
    const listener = vi.fn();
    store.subscribe(settingsOptions.storageKey, listener);

    store.writeValue(settingsOptions, { theme: "dark" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.readValue(settingsOptions)).toEqual({ theme: "dark" });
    expect(storage.entries.size).toBe(0);
  });

  it("stops notifying after unsubscribe", () => {
    const store = createLocalStorageStore(() => createFakeStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(settingsOptions.storageKey, listener);
    unsubscribe();

    store.writeValue(settingsOptions, { theme: "dark" });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("handleStorageEvent", () => {
  it("ignores events whose raw value matches the cache", () => {
    const raw = JSON.stringify({ theme: "dark" });
    const storage = createFakeStorage({ [settingsOptions.storageKey]: raw });
    const store = createLocalStorageStore(() => storage);
    const listener = vi.fn();
    store.subscribe(settingsOptions.storageKey, listener);
    store.readValue(settingsOptions);

    store.handleStorageEvent(settingsOptions.storageKey, raw);

    expect(listener).not.toHaveBeenCalled();
  });

  it("invalidates and lazily re-reads on a changed raw value", () => {
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark" }),
    });
    const store = createLocalStorageStore(() => storage);
    const listener = vi.fn();
    store.subscribe(settingsOptions.storageKey, listener);
    store.readValue(settingsOptions);

    const nextRaw = JSON.stringify({ theme: "other-tab" });
    storage.entries.set(settingsOptions.storageKey, nextRaw);
    store.handleStorageEvent(settingsOptions.storageKey, nextRaw);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.readValue(settingsOptions)).toEqual({ theme: "other-tab" });
  });

  it("ignores events for keys that were never read", () => {
    const store = createLocalStorageStore(() => createFakeStorage());
    const listener = vi.fn();
    store.subscribe(settingsOptions.storageKey, listener);

    store.handleStorageEvent(settingsOptions.storageKey, "anything");

    expect(listener).not.toHaveBeenCalled();
  });

  it("invalidates every cached key on a cross-tab clear", () => {
    const otherOptions: StorageKeyOptions<Settings> = {
      ...settingsOptions,
      storageKey: "toolbox.test.other.v1",
    };
    const storage = createFakeStorage({
      [settingsOptions.storageKey]: JSON.stringify({ theme: "dark" }),
      [otherOptions.storageKey]: JSON.stringify({ theme: "blue" }),
    });
    const store = createLocalStorageStore(() => storage);
    const settingsListener = vi.fn();
    const otherListener = vi.fn();
    store.subscribe(settingsOptions.storageKey, settingsListener);
    store.subscribe(otherOptions.storageKey, otherListener);
    store.readValue(settingsOptions);
    store.readValue(otherOptions);

    storage.entries.clear();
    store.handleStorageEvent(null, null);

    expect(settingsListener).toHaveBeenCalledTimes(1);
    expect(otherListener).toHaveBeenCalledTimes(1);
    expect(store.readValue(settingsOptions)).toBe(DEFAULT_SETTINGS);
  });
});
