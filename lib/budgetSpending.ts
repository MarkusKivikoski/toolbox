// Spending log for a budget section — no React, fully unit-testable.
//
// A section is a planned amount for the month ("Hauska: 200 €"). Its spending
// log is the list of individual purchases made out of it, so you can watch the
// planned amount get used up without those purchases ever touching the
// month's budget totals.

import { parseAmount } from "@/lib/utils";

/** One purchase logged against a section. Same shape as a budget line. */
export type SpendingEntry = {
  id: string;
  /** Free-typed description, e.g. "Elokuvat". */
  name: string;
  /** Free-typed euro amount, kept as a string so partial input survives. */
  amount: string;
};

export type SpendingSummary = {
  /** The logged entries, in the order they were added. */
  entries: SpendingEntry[];
  /** Sum of the logged entries. */
  spent: number;
  /** budget − spent (negative once the budget is overspent). */
  left: number;
  /** spent / budget, clamped to 0–1 — how full the meter is. */
  fraction: number;
  isOver: boolean;
};

const CENTS_PER_EURO = 100;

/** Whole cents, so "exactly on budget" isn't thrown off by float noise. */
const toCents = (euros: number) => Math.round(euros * CENTS_PER_EURO);

/**
 * How much of `budget` the logged entries have used. `null` when the section
 * has no entries at all — it isn't being tracked, so there's nothing to show.
 */
export function computeSpending(
  entries: SpendingEntry[] | undefined,
  budget: number,
): SpendingSummary | null {
  if (!entries || entries.length === 0) return null;
  const spent = entries.reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const fraction = budget > 0 ? Math.min(1, spent / budget) : spent > 0 ? 1 : 0;
  return {
    entries,
    spent,
    left: budget - spent,
    fraction,
    isOver: toCents(spent) > toCents(budget),
  };
}

function normalizeEntry(stored: unknown, index: number): SpendingEntry {
  const entry = (stored ?? {}) as Partial<SpendingEntry>;
  return {
    // Deterministic fallback: this runs on every storage read, so a random id
    // here would change between reads.
    id: typeof entry.id === "string" ? entry.id : `entry-${index}`,
    name: typeof entry.name === "string" ? entry.name : "",
    amount: typeof entry.amount === "string" ? entry.amount : "",
  };
}

/**
 * Backfill a stored spending log. Anything that isn't a non-empty list becomes
 * `undefined` — "not tracked" — so old saves and an emptied log look the same.
 */
export function normalizeSpending(stored: unknown): SpendingEntry[] | undefined {
  if (!Array.isArray(stored)) return undefined;
  const entries = stored.map(normalizeEntry);
  return entries.length > 0 ? entries : undefined;
}
