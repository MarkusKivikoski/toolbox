"use client";

import { useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { normalizeInput, type InvestingInput } from "@/lib/investing";
import { SAVED_STORAGE_KEY } from "../constants";

export type SavedCalc = {
  id: string;
  name: string;
  input: InvestingInput;
  updatedAt: number;
};

type Store = { calcs: SavedCalc[]; activeId: string | null };

const EMPTY_STORE: Store = { calcs: [], activeId: null };

function normalizeStore(stored: unknown): Store {
  if (typeof stored !== "object" || stored === null) return EMPTY_STORE;
  const parsed = stored as Store;
  if (!Array.isArray(parsed.calcs)) return EMPTY_STORE;
  return {
    calcs: parsed.calcs.map((calc) => ({
      ...calc,
      input: normalizeInput(calc.input),
    })),
    activeId: parsed.activeId ?? null,
  };
}

const clone = (input: InvestingInput): InvestingInput => structuredClone(input);

export default function SavedCalculations({
  current,
  onLoad,
  defaultInput,
}: {
  current: InvestingInput;
  onLoad: (input: InvestingInput) => void;
  defaultInput: InvestingInput;
}) {
  const { value: store, setValue: setStore } = useLocalStorageState({
    storageKey: SAVED_STORAGE_KEY,
    defaultValue: EMPTY_STORE,
    normalize: normalizeStore,
  });
  const { calcs, activeId } = store;
  // What the user has typed since last picking/saving a calculation; when
  // null, the input shows the active calculation's saved name.
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const active = calcs.find((calc) => calc.id === activeId) ?? null;
  const name = nameDraft ?? active?.name ?? "";
  const dirty = active
    ? JSON.stringify(active.input) !== JSON.stringify(current)
    : false;
  const trimmed = name.trim();

  function save() {
    if (!trimmed) return;
    if (active) {
      setStore((previous) => ({
        ...previous,
        calcs: previous.calcs.map((calc) =>
          calc.id === active.id
            ? { ...calc, name: trimmed, input: clone(current), updatedAt: Date.now() }
            : calc
        ),
      }));
    } else {
      const id = crypto.randomUUID();
      setStore((previous) => ({
        calcs: [
          ...previous.calcs,
          { id, name: trimmed, input: clone(current), updatedAt: Date.now() },
        ],
        activeId: id,
      }));
    }
    setNameDraft(null);
  }

  function saveAsCopy() {
    const id = crypto.randomUUID();
    const copyName = trimmed ? `${trimmed} (copy)` : "Untitled";
    setStore((previous) => ({
      calcs: [
        ...previous.calcs,
        { id, name: copyName, input: clone(current), updatedAt: Date.now() },
      ],
      activeId: id,
    }));
    setNameDraft(null);
  }

  function load(calc: SavedCalc) {
    setStore((previous) => ({ ...previous, activeId: calc.id }));
    setNameDraft(null);
    onLoad(clone(calc.input));
  }

  function remove(calc: SavedCalc) {
    if (!confirm(`Delete "${calc.name}"?`)) return;
    setStore((previous) => ({
      calcs: previous.calcs.filter((savedCalc) => savedCalc.id !== calc.id),
      activeId: previous.activeId === calc.id ? null : previous.activeId,
    }));
  }

  function newCalc() {
    setStore((previous) => ({ ...previous, activeId: null }));
    setNameDraft(null);
    onLoad(clone(defaultInput));
  }

  const saveLabel = active ? (dirty ? "Update" : "Saved ✓") : "Save";
  const saveDisabled = !trimmed || (active != null && !dirty);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          My calculations
        </h2>
        <button
          type="button"
          onClick={newCalc}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        >
          + New
        </button>
      </div>

      {calcs.length > 0 ? (
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {calcs.map((calc) => {
            const isActive = calc.id === activeId;
            return (
              <div
                key={calc.id}
                className={`flex flex-shrink-0 items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm transition-colors ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => load(calc)}
                  className="max-w-[12rem] truncate font-medium"
                  title={calc.name}
                >
                  {calc.name}
                  {isActive && dirty && (
                    <span className="ml-1 text-amber-500" title="Unsaved changes">
                      •
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(calc)}
                  aria-label={`Delete ${calc.name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/5 hover:text-red-500 dark:hover:bg-white/10"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-3 text-sm text-zinc-400">
          No saved calculations yet — name one (e.g. &ldquo;Child&rsquo;s
          fund&rdquo;) and save it.
        </p>
      )}

      <div className="flex flex-wrap items-stretch gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setNameDraft(event.target.value)}
          placeholder="Name this calculation…"
          className="min-w-0 flex-1 basis-48 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saveDisabled}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {saveLabel}
        </button>
        {active && (
          <button
            type="button"
            onClick={saveAsCopy}
            className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Save as copy
          </button>
        )}
      </div>
    </section>
  );
}
