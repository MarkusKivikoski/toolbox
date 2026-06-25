"use client";

import { useEffect, useState } from "react";
import type { InvestingInput } from "@/lib/investing";

export type SavedCalc = {
  id: string;
  name: string;
  input: InvestingInput;
  updatedAt: number;
};

const KEY = "toolbox.investing-calculator.saved.v1";

type Store = { calcs: SavedCalc[]; activeId: string | null };

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.calcs)) {
        return { calcs: parsed.calcs, activeId: parsed.activeId ?? null };
      }
    }
  } catch {
    /* ignore */
  }
  return { calcs: [], activeId: null };
}

const clone = (input: InvestingInput): InvestingInput =>
  JSON.parse(JSON.stringify(input));

const newId = () =>
  `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function SavedCalculations({
  current,
  onLoad,
  defaultInput,
}: {
  current: InvestingInput;
  onLoad: (input: InvestingInput) => void;
  defaultInput: InvestingInput;
}) {
  const [calcs, setCalcs] = useState<SavedCalc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = loadStore();
    setCalcs(store.calcs);
    setActiveId(store.activeId);
    const act = store.calcs.find((c) => c.id === store.activeId);
    if (act) setName(act.name);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ calcs, activeId }));
    } catch {
      /* ignore */
    }
  }, [calcs, activeId, hydrated]);

  const active = calcs.find((c) => c.id === activeId) ?? null;
  const dirty = active
    ? JSON.stringify(active.input) !== JSON.stringify(current)
    : false;
  const trimmed = name.trim();

  function save() {
    if (!trimmed) return;
    if (active) {
      setCalcs((cs) =>
        cs.map((c) =>
          c.id === active.id
            ? { ...c, name: trimmed, input: clone(current), updatedAt: Date.now() }
            : c
        )
      );
    } else {
      const id = newId();
      setCalcs((cs) => [
        ...cs,
        { id, name: trimmed, input: clone(current), updatedAt: Date.now() },
      ]);
      setActiveId(id);
    }
  }

  function saveAsCopy() {
    const id = newId();
    const copyName = trimmed ? `${trimmed} (copy)` : "Untitled";
    setCalcs((cs) => [
      ...cs,
      { id, name: copyName, input: clone(current), updatedAt: Date.now() },
    ]);
    setActiveId(id);
    setName(copyName);
  }

  function load(c: SavedCalc) {
    setActiveId(c.id);
    setName(c.name);
    onLoad(clone(c.input));
  }

  function remove(c: SavedCalc) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    setCalcs((cs) => cs.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
  }

  function newCalc() {
    setActiveId(null);
    setName("");
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
          {calcs.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className={`flex flex-shrink-0 items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm transition-colors ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => load(c)}
                  className="max-w-[12rem] truncate font-medium"
                  title={c.name}
                >
                  {c.name}
                  {isActive && dirty && (
                    <span className="ml-1 text-amber-500" title="Unsaved changes">
                      •
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.name}`}
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
          onChange={(e) => setName(e.target.value)}
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
