// Generic helpers for the budget visualizer — nothing here encodes a budgeting
// rule, so it could be lifted into an unrelated project unchanged.

import { DATE_LOCALE } from "./constants";

/** A fresh unique id for a newly added income/section row. */
export const newRowId = () => crypto.randomUUID();

/** A "Mon YYYY" label for a date this many whole months from today. */
export const dateInMonths = (months: number) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString(DATE_LOCALE, { month: "short", year: "numeric" });
};

/**
 * Reorder `items` to match `orderedIds`. Returns `null` when the ids don't map
 * cleanly onto the items or the order is unchanged, so callers can skip a
 * needless state update.
 */
export function reorderById<Item extends { id: string }>(
  items: Item[],
  orderedIds: string[],
): Item[] | null {
  const byId = new Map(items.map((item) => [item.id, item]));
  const next = orderedIds
    .map((id) => byId.get(id))
    .filter((item): item is Item => item != null);
  if (next.length !== items.length) return null;
  const changed = next.some((item, index) => item.id !== items[index].id);
  return changed ? next : null;
}

const MONTHS_PER_YEAR = 12;

/** Build a "YYYY-MM" key from a year and a 1-based month. */
export const toMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

/** The year and 1-based month a "YYYY-MM" key stands for. */
export const parseMonthKey = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
};

/** The "YYYY-MM" key for today's month. */
export const currentMonthKey = () => {
  const today = new Date();
  return toMonthKey(today.getFullYear(), today.getMonth() + 1);
};

/** The key this many months before (negative) or after (positive) `key`. */
export const shiftMonthKey = (key: string, delta: number) => {
  const { year, month } = parseMonthKey(key);
  const zeroBased = year * MONTHS_PER_YEAR + (month - 1) + delta;
  return toMonthKey(Math.floor(zeroBased / MONTHS_PER_YEAR), (zeroBased % MONTHS_PER_YEAR) + 1);
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Marraskuu 2026" for a "YYYY-MM" key. */
export const formatMonthLabel = (key: string) => {
  const { year, month } = parseMonthKey(key);
  return capitalize(
    new Date(year, month - 1, 1).toLocaleDateString(DATE_LOCALE, {
      month: "long",
      year: "numeric",
    }),
  );
};

/** Short month name ("Marras.") for the picker grid, from a 1-based month. */
export const formatShortMonth = (month: number) =>
  capitalize(
    new Date(2000, month - 1, 1).toLocaleDateString(DATE_LOCALE, { month: "short" }),
  );
