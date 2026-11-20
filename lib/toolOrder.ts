/** Slugs of the tools in the order the user arranged them. */
export type ToolOrder = string[];

export const DEFAULT_TOOL_ORDER: ToolOrder = [];

/** Validates a stored value: keeps only unique string entries. */
export function normalizeStoredOrder(stored: unknown): ToolOrder {
  if (!Array.isArray(stored)) return DEFAULT_TOOL_ORDER;
  const seen = new Set<string>();
  for (const entry of stored) {
    if (typeof entry === "string") seen.add(entry);
  }
  return [...seen];
}

/**
 * Sorts items by the saved slug order. Items missing from the saved order
 * (newly added tools) keep their original relative order at the end; saved
 * slugs with no matching item are ignored.
 */
export function applyToolOrder<Item extends { slug: string }>(
  items: Item[],
  order: ToolOrder,
): Item[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const ordered: Item[] = [];
  for (const slug of order) {
    const item = bySlug.get(slug);
    if (item) {
      ordered.push(item);
      bySlug.delete(slug);
    }
  }
  return [...ordered, ...bySlug.values()];
}

/** Moves `slug` to `targetIndex` (clamped) within `slugs`. */
export function moveSlug(
  slugs: string[],
  slug: string,
  targetIndex: number,
): string[] {
  const fromIndex = slugs.indexOf(slug);
  if (fromIndex === -1) return slugs;
  const remaining = slugs.filter((entry) => entry !== slug);
  const clampedIndex = Math.max(0, Math.min(targetIndex, remaining.length));
  remaining.splice(clampedIndex, 0, slug);
  return remaining;
}
