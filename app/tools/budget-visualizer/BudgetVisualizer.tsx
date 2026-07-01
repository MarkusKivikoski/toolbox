"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  computeBudget,
  computeSavings,
  colorForIndex,
  normalizeState,
  parseAmount,
  type BudgetRow,
  type BudgetState,
  type SavingsState,
} from "@/lib/budget";
import { formatDuration, formatEur } from "@/lib/format";
import BudgetDoughnut from "./BudgetDoughnut";

const STORAGE_KEY = "toolbox.budget-visualizer.state.v1";

let rowSeq = 0;
const newRowId = () => `row-${++rowSeq}-${Date.now()}`;

/** Uppercase just the first character, leaving the rest as typed. */
const capitalizeFirst = (s: string) =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);

const DEFAULT_STATE: BudgetState = {
  incomes: [
    { id: "income-salary", name: "Salary", amount: "2800" },
    { id: "income-side", name: "Side projects", amount: "400" },
  ],
  sections: [
    { id: "section-rent", name: "Rent", amount: "950" },
    { id: "section-groceries", name: "Groceries", amount: "450" },
    { id: "section-transport", name: "Transport", amount: "160" },
    { id: "section-utilities", name: "Utilities", amount: "130" },
    { id: "section-subscriptions", name: "Subscriptions", amount: "60" },
    { id: "section-funmoney", name: "Eating out & fun", amount: "200" },
  ],
  savings: { enabled: true, balance: "2000", target: "15000" },
};

const blankState = (): BudgetState => ({
  incomes: [{ id: newRowId(), name: "", amount: "" }],
  sections: [{ id: newRowId(), name: "", amount: "" }],
  savings: { enabled: false, balance: "", target: "" },
});

const pctFmt = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** A "Mon YYYY" label for a date this many whole months from today. */
const dateInMonths = (months: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en", { month: "short", year: "numeric" });
};

/** Shared editable line: name + euro amount + remove, with an optional colour dot. */
function RowEditor({
  row,
  ariaPrefix,
  namePlaceholder,
  fallbackNoun,
  dotColor,
  showDot,
  autoFocus,
  onAutoFocused,
  onName,
  onAmount,
  onRemove,
  onMouseEnter,
  onMouseLeave,
  dragging,
  onDragPointerDown,
  onHandleKeyDown,
}: {
  row: BudgetRow;
  ariaPrefix: string;
  namePlaceholder: string;
  fallbackNoun: string;
  dotColor?: string;
  showDot: boolean;
  /** Focus the name input on mount — set for a freshly added row. */
  autoFocus: boolean;
  onAutoFocused: () => void;
  onName: (v: string) => void;
  onAmount: (v: string) => void;
  onRemove: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** When set, a drag handle is shown and the row can be reordered. */
  dragging?: boolean;
  onDragPointerDown?: (e: ReactPointerEvent) => void;
  onHandleKeyDown?: (e: ReactKeyboardEvent) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const draggable = onDragPointerDown != null;

  useEffect(() => {
    if (!autoFocus) return;
    nameRef.current?.focus();
    onAutoFocused();
  }, [autoFocus, onAutoFocused]);

  return (
    <div
      data-row-id={row.id}
      className={`grid items-center gap-2 rounded-xl transition-opacity ${
        draggable
          ? "grid-cols-[1.25rem_1fr_6.5rem_2.25rem]"
          : "grid-cols-[1fr_6.5rem_2.25rem]"
      } ${dragging ? "opacity-50" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {draggable && (
        <button
          type="button"
          aria-label={`Reorder ${row.name.trim() || fallbackNoun}`}
          onPointerDown={onDragPointerDown}
          onKeyDown={onHandleKeyDown}
          className="flex h-9 w-5 cursor-grab touch-none items-center justify-center rounded text-zinc-300 outline-none hover:text-zinc-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <circle cx="7.5" cy="5" r="1.4" />
            <circle cx="12.5" cy="5" r="1.4" />
            <circle cx="7.5" cy="10" r="1.4" />
            <circle cx="12.5" cy="10" r="1.4" />
            <circle cx="7.5" cy="15" r="1.4" />
            <circle cx="12.5" cy="15" r="1.4" />
          </svg>
        </button>
      )}
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        {showDot && (
          <span
            className="mr-2 h-3 w-3 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
        )}
        <input
          ref={nameRef}
          type="text"
          value={row.name}
          onChange={(e) => onName(capitalizeFirst(e.target.value))}
          placeholder={namePlaceholder}
          aria-label={`${ariaPrefix} name`}
          className="w-full min-w-0 bg-transparent py-2.5 text-base font-medium outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-400">€</span>
        <input
          type="text"
          inputMode="decimal"
          value={row.amount}
          onChange={(e) => onAmount(e.target.value)}
          placeholder="0"
          aria-label={`${ariaPrefix} amount`}
          className="w-full min-w-0 bg-transparent py-2.5 pl-1 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${row.name.trim() || fallbackNoun}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

/** Dashed full-width "add another row" button. */
function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M10 4.75a.75.75 0 0 1 .75.75v3.75h3.75a.75.75 0 0 1 0 1.5h-3.75v3.75a.75.75 0 0 1-1.5 0v-3.75H5.5a.75.75 0 0 1 0-1.5h3.75V5.5a.75.75 0 0 1 .75-.75Z" />
      </svg>
      {label}
    </button>
  );
}

/** A small labelled euro input, used for the savings balance and target. */
function EuroField({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-400">€</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          aria-label={ariaLabel}
          className="w-full min-w-0 bg-transparent py-2.5 pl-1 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
    </label>
  );
}

type RowField = "incomes" | "sections";

export default function BudgetVisualizer() {
  const [state, setState] = useState<BudgetState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const clearFocusRow = useCallback(() => setFocusRowId(null), []);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const sectionsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeState(JSON.parse(raw), DEFAULT_STATE));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Auto-cancel the reset confirmation if it isn't taken.
  useEffect(() => {
    if (!confirmReset) return;
    const t = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmReset]);

  const { incomes, sections, savings } = state;
  const summary = useMemo(
    () =>
      computeBudget(
        incomes,
        sections,
        savings.enabled ? "To savings" : "Left to budget",
      ),
    [incomes, sections, savings.enabled],
  );
  const projection = useMemo(
    () => computeSavings(summary.remaining, savings.balance, savings.target),
    [summary.remaining, savings.balance, savings.target],
  );

  const updateSavings = (patch: Partial<SavingsState>) =>
    setState((s) => ({ ...s, savings: { ...s.savings, ...patch } }));

  const updateRow = (field: RowField, id: string, patch: Partial<BudgetRow>) =>
    setState((s) => ({
      ...s,
      [field]: s[field].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const addRow = (field: RowField) => {
    const id = newRowId();
    setState((s) => ({
      ...s,
      [field]: [...s[field], { id, name: "", amount: "" }],
    }));
    setFocusRowId(id); // focus the new row's name input once it renders
  };

  const removeRow = (field: RowField, id: string) => {
    setActiveId((a) => (a === id ? null : a));
    setState((s) => ({
      ...s,
      [field]: s[field].filter((r) => r.id !== id),
    }));
  };

  const moveSection = (from: number, to: number) =>
    setState((s) => {
      if (to < 0 || to >= s.sections.length || from === to) return s;
      const sections = s.sections.slice();
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { ...s, sections };
    });

  // --- Drag-to-reorder (pointer-based, so it works with mouse and touch) ---

  // Slot the dragged section wherever the pointer is, by comparing against the
  // midpoints of the other rows currently on screen.
  const reorderToPointer = useCallback((clientY: number) => {
    const container = sectionsListRef.current;
    const draggingId = dragIdRef.current;
    if (!container || !draggingId) return;
    const rows = Array.from(
      container.querySelectorAll<HTMLElement>("[data-row-id]"),
    );
    const otherIds: string[] = [];
    let insertAt = 0;
    for (const el of rows) {
      const id = el.dataset.rowId!;
      if (id === draggingId) continue;
      const rect = el.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) insertAt = otherIds.length + 1;
      otherIds.push(id);
    }
    otherIds.splice(insertAt, 0, draggingId);
    setState((s) => {
      const byId = new Map(s.sections.map((r) => [r.id, r]));
      const next = otherIds
        .map((id) => byId.get(id))
        .filter((r): r is BudgetRow => r != null);
      if (next.length !== s.sections.length) return s;
      const changed = next.some((r, i) => r.id !== s.sections[i].id);
      return changed ? { ...s, sections: next } : s;
    });
  }, []);

  const onDragPointerMove = useCallback(
    (e: PointerEvent) => reorderToPointer(e.clientY),
    [reorderToPointer],
  );

  const endDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    window.removeEventListener("pointermove", onDragPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  }, [onDragPointerMove]);

  const startDrag = useCallback(
    (e: ReactPointerEvent, id: string) => {
      e.preventDefault();
      dragIdRef.current = id;
      setDragId(id);
      setActiveId(null);
      window.addEventListener("pointermove", onDragPointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },
    [onDragPointerMove, endDrag],
  );

  // Drop any stray listeners if we unmount mid-drag.
  useEffect(() => endDrag, [endDrag]);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    setActiveId(null);
    setState(blankState());
  };

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  const { remaining, allocated, overBudget, slices, income } = summary;

  const statusPill = (() => {
    if (income <= 0) {
      return {
        tone: "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
        text: "Add your monthly income to see what's left",
      };
    }
    if (overBudget) {
      return {
        tone: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
        text: `${formatEur(-remaining)} over budget`,
      };
    }
    if (remaining < 0.005) {
      return {
        tone: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
        text: "Every euro allocated 🎉",
      };
    }
    return {
      tone: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
      text: savings.enabled
        ? `${formatEur(remaining)} going to savings`
        : `${formatEur(remaining)} left to budget`,
    };
  })();

  return (
    <div className="space-y-5">
      {/* Form: income sources + sections */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        {/* Income sources */}
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Monthly income
        </span>
        <div className="mt-2 space-y-2">
          {incomes.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
              No income sources yet — add one to start.
            </p>
          )}
          {incomes.map((row, i) => (
            <RowEditor
              key={row.id}
              row={row}
              ariaPrefix={`Income ${i + 1}`}
              namePlaceholder="Income source"
              fallbackNoun="income source"
              showDot={false}
              autoFocus={row.id === focusRowId}
              onAutoFocused={clearFocusRow}
              onName={(v) => updateRow("incomes", row.id, { name: v })}
              onAmount={(v) => updateRow("incomes", row.id, { amount: v })}
              onRemove={() => removeRow("incomes", row.id)}
            />
          ))}
        </div>
        <AddButton label="Add income source" onClick={() => addRow("incomes")} />
        {incomes.length > 1 && (
          <div className="mt-2 flex items-center justify-end gap-2 px-1 text-sm">
            <span className="text-zinc-500">Total income</span>
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatEur(income)}
            </span>
          </div>
        )}

        {/* Sections */}
        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Budget sections
          </span>
          <div
            ref={sectionsListRef}
            className={`mt-2 space-y-2 ${dragId ? "select-none" : ""}`}
          >
            {sections.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
                No sections yet — add one to start splitting up your budget.
              </p>
            )}
            {sections.map((row, i) => {
              const amount = parseAmount(row.amount);
              return (
                <RowEditor
                  key={row.id}
                  row={row}
                  ariaPrefix={`Section ${i + 1}`}
                  namePlaceholder="Section name"
                  fallbackNoun="section"
                  showDot
                  dotColor={amount > 0 ? colorForIndex(i) : undefined}
                  autoFocus={row.id === focusRowId}
                  onAutoFocused={clearFocusRow}
                  onName={(v) => updateRow("sections", row.id, { name: v })}
                  onAmount={(v) => updateRow("sections", row.id, { amount: v })}
                  onRemove={() => removeRow("sections", row.id)}
                  onMouseEnter={() =>
                    !dragId && amount > 0 ? setActiveId(row.id) : undefined
                  }
                  onMouseLeave={() => !dragId && setActiveId(null)}
                  dragging={row.id === dragId}
                  onDragPointerDown={(e) => startDrag(e, row.id)}
                  onHandleKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveSection(i, i - 1);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveSection(i, i + 1);
                    }
                  }}
                />
              );
            })}
          </div>
          <AddButton label="Add section" onClick={() => addRow("sections")} />
        </div>

        {/* Optional savings goal */}
        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <label className="flex cursor-pointer select-none items-center gap-2.5">
            <input
              type="checkbox"
              checked={savings.enabled}
              onChange={(e) => updateSavings({ enabled: e.target.checked })}
              className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-600"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Track savings toward a goal
            </span>
          </label>

          {savings.enabled && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
              <EuroField
                label="Current savings"
                value={savings.balance}
                onChange={(v) => updateSavings({ balance: v })}
                ariaLabel="Current savings"
              />
              <EuroField
                label="Savings target"
                value={savings.target}
                onChange={(v) => updateSavings({ target: v })}
                ariaLabel="Savings target"
              />
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              confirmReset
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                clipRule="evenodd"
              />
            </svg>
            {confirmReset ? "Tap again to clear everything" : "Reset form"}
          </button>
        </div>
      </div>

      {/* Visualization: doughnut + legend */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <BudgetDoughnut
          slices={slices}
          allocated={allocated}
          overBudget={overBudget}
          activeId={activeId}
          onActiveChange={setActiveId}
        />

        <div
          className={`mx-auto mt-4 max-w-xs rounded-xl border px-4 py-2.5 text-center text-sm font-medium ${statusPill.tone}`}
        >
          {statusPill.text}
        </div>

        {slices.length === 0 ? (
          <p className="mt-4 text-center text-sm text-zinc-400">
            Add a section amount to fill in the doughnut.
          </p>
        ) : (
          <ul className="mt-4 space-y-1">
            {slices.map((slice) => {
              const isActive = slice.id === activeId;
              return (
                <li
                  key={slice.id}
                  onMouseEnter={() => setActiveId(slice.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                    isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""
                  }`}
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${
                      slice.isRemainder ? "bg-zinc-200 dark:bg-zinc-700" : ""
                    }`}
                    style={{ backgroundColor: slice.color ?? undefined }}
                    aria-hidden
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      slice.isRemainder
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {slice.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                    {pctFmt.format(slice.fraction)}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatEur(slice.amount)}
                  </span>
                </li>
              );
            })}

            {/* Allocated total footer */}
            <li className="mt-1 flex items-center gap-3 border-t border-zinc-100 px-2 pt-2 dark:border-zinc-800">
              <span className="h-3 w-3 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 text-sm font-medium text-zinc-500">
                Allocated
              </span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                {income > 0 ? pctFmt.format(allocated / income) : ""}
              </span>
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatEur(allocated)}
              </span>
            </li>
          </ul>
        )}

        {/* Savings projection */}
        {savings.enabled && (
          <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Saving each month
                </div>
                <div className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatEur(projection.monthly)}
                  <span className="text-base font-medium text-zinc-400"> /mo</span>
                </div>
                <div className="text-xs text-zinc-400">
                  from your unallocated budget
                </div>
              </div>
              {projection.target > 0 && (
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatEur(projection.balance)}{" "}
                    <span className="font-normal text-zinc-400">
                      of {formatEur(projection.target)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {pctFmt.format(projection.progress)} saved
                  </div>
                </div>
              )}
            </div>

            {projection.target > 0 && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.max(
                      projection.progress * 100,
                      projection.progress > 0 ? 2 : 0,
                    )}%`,
                  }}
                />
              </div>
            )}

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
              {projection.reached ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  🎉 You&apos;ve reached your savings target!
                </span>
              ) : projection.target <= 0 ? (
                <span className="text-zinc-500">
                  Set a target to see how long it&apos;ll take to get there.
                </span>
              ) : projection.monthsToTarget === null ? (
                <span className="text-amber-700 dark:text-amber-400">
                  No money left over to save — trim your budget to start building
                  toward this goal.
                </span>
              ) : (
                <span className="text-zinc-700 dark:text-zinc-200">
                  On track to reach{" "}
                  <span className="font-semibold">
                    {formatEur(projection.target)}
                  </span>{" "}
                  in{" "}
                  <span className="font-semibold">
                    {formatDuration(projection.monthsToTarget / 12)}
                  </span>{" "}
                  — around{" "}
                  <span className="font-semibold">
                    {dateInMonths(projection.monthsToTarget)}
                  </span>
                  .
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Everything stays in your browser — nothing is uploaded. Add as many
        income sources and sections as you like; the doughnut and totals update
        as you type.
      </p>
    </div>
  );
}
