// Generic helpers for the budget visualizer — nothing here encodes a budgeting
// rule, so it could be lifted into an unrelated project unchanged.

/** A fresh unique id for a newly added income/section row. */
export const newRowId = () => crypto.randomUUID();

/** Uppercase just the first character, leaving the rest as typed. */
export const capitalizeFirst = (value: string) =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

/** Whole-number percentages, e.g. "42%", for the legend and progress readouts. */
export const pctFmt = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** A "Mon YYYY" label for a date this many whole months from today. */
export const dateInMonths = (months: number) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en", { month: "short", year: "numeric" });
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
