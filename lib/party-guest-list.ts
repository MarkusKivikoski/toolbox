// Party guest list model — no React, fully unit-testable.
//
// A guest list is a *flat* array of rows, not a tree. A row is either a guest
// or a section heading ("Colleagues", "Family"), and guest nesting is exactly
// one level deep, so "is a plus-one of the main guest above me" collapses to a
// single boolean. Sections are implied by position: a guest belongs to the
// nearest heading above it, and guests above the first heading belong to none.
//
// Keeping it flat means reordering is an array splice and indenting is a flag
// flip, which is what lets one pointer gesture drive both.
//
// The invariant everything here upholds: a plus-one always has a guest row
// directly above it — never nothing, never a heading.

/** One person on the list. */
export type Guest = {
  kind: "guest";
  id: string;
  /** Free-typed name; may be empty while the row is being filled in. */
  name: string;
  /** True when this guest is a plus-one of the guest directly above. */
  isPlusOne: boolean;
  /** They RSVP'd yes. */
  hasConfirmed: boolean;
  /** They walked in the door. */
  hasArrived: boolean;
};

/** A section title; everything below it belongs to it until the next one. */
export type Heading = {
  kind: "heading";
  id: string;
  title: string;
};

export type ListRow = Guest | Heading;

export const isGuest = (row: ListRow): row is Guest => row.kind === "guest";

/** Tolerates an out-of-range index so boundary walks can stay one-liners. */
const isPlusOneRow = (row: ListRow | undefined): boolean =>
  row != null && isGuest(row) && row.isPlusOne;

/** One named event with its own list. */
export type Party = {
  id: string;
  name: string;
  rows: ListRow[];
  updatedAt: number;
};

export type GuestListState = {
  parties: Party[];
  /** The party currently being edited, or `null` when none exists yet. */
  activeId: string | null;
};

export type GuestCounts = {
  /** Everybody on the list, plus-ones included. Headings don't count. */
  total: number;
  confirmed: number;
  arrived: number;
  mainGuests: number;
  plusOnes: number;
};

/** A heading and the guests under it, ready to render. */
export type RowGroup = {
  heading: Heading | null;
  guests: Guest[];
};

export const DEFAULT_GUEST_LIST_STATE: GuestListState = {
  parties: [],
  activeId: null,
};

export const createGuest = (isPlusOne = false): Guest => ({
  kind: "guest",
  id: crypto.randomUUID(),
  name: "",
  isPlusOne,
  hasConfirmed: false,
  hasArrived: false,
});

export const createHeading = (): Heading => ({
  kind: "heading",
  id: crypto.randomUUID(),
  title: "",
});

export const createParty = (name: string): Party => ({
  id: crypto.randomUUID(),
  name,
  rows: [],
  updatedAt: Date.now(),
});

/**
 * A plus-one needs a guest row directly above to belong to. Promote any that
 * lost theirs — at the top of the list, or stranded under a heading.
 */
function enforcePlusOneParents(rows: ListRow[]): ListRow[] {
  let next: ListRow[] | null = null;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!isGuest(row) || !row.isPlusOne) continue;
    const above = index > 0 ? rows[index - 1] : null;
    if (above && isGuest(above)) continue;
    next ??= rows.slice();
    next[index] = { ...row, isPlusOne: false };
  }
  return next ?? rows;
}

export function countGuests(rows: ListRow[]): GuestCounts {
  const counts: GuestCounts = {
    total: 0,
    confirmed: 0,
    arrived: 0,
    mainGuests: 0,
    plusOnes: 0,
  };
  for (const row of rows) {
    if (!isGuest(row)) continue;
    counts.total += 1;
    if (row.hasConfirmed) counts.confirmed += 1;
    if (row.hasArrived) counts.arrived += 1;
    if (row.isPlusOne) counts.plusOnes += 1;
    else counts.mainGuests += 1;
  }
  return counts;
}

/**
 * Split the flat list into renderable sections. The leading un-sectioned group
 * is emitted only when it holds someone, or when there are no headings at all
 * — an empty list still needs somewhere to add the first guest.
 */
export function groupRowsBySection(rows: ListRow[]): RowGroup[] {
  const groups: RowGroup[] = [{ heading: null, guests: [] }];
  for (const row of rows) {
    if (isGuest(row)) groups[groups.length - 1].guests.push(row);
    else groups.push({ heading: row, guests: [] });
  }
  if (groups.length > 1 && groups[0].guests.length === 0) groups.shift();
  return groups;
}

/**
 * The half-open `[start, end)` slice that moves as one unit when this row is
 * dragged: a heading carries its whole section, a main guest carries its
 * trailing plus-ones, a plus-one travels alone. `null` when the id is unknown.
 */
export function rowBlockRange(
  rows: ListRow[],
  id: string,
): [number, number] | null {
  const start = rows.findIndex((row) => row.id === id);
  if (start === -1) return null;
  const row = rows[start];
  let end = start + 1;
  if (!isGuest(row)) {
    while (end < rows.length && isGuest(rows[end])) end += 1;
    return [start, end];
  }
  if (row.isPlusOne) return [start, end];
  while (isPlusOneRow(rows[end])) end += 1;
  return [start, end];
}

/**
 * Where a "move up one" keystroke should land this row's block, in the same
 * list-minus-block coordinates `moveRowBlock` takes. A heading hops to the
 * previous section boundary; a main guest hops the block above it (crossing a
 * heading if that's what's there, which is how you move somebody between
 * sections); a plus-one steps up one row so it can be reordered within its own
 * run. `null` when it's already at the top.
 */
export function previousBlockIndex(rows: ListRow[], id: string): number | null {
  const range = rowBlockRange(rows, id);
  if (!range) return null;
  const [start, end] = range;
  if (start === 0) return null;
  const row = rows[start];
  if (isGuest(row) && row.isPlusOne) return start - 1;
  const rest = [...rows.slice(0, start), ...rows.slice(end)];
  let index = start - 1;
  if (isGuest(row)) {
    while (index > 0 && isPlusOneRow(rest[index])) index -= 1;
    return index;
  }
  while (index > 0 && isGuest(rest[index])) index -= 1;
  return index;
}

/**
 * Move a row — with whatever travels with it — so the block starts at
 * `targetIndex`, an index into the list *with the block already removed*
 * (which is what the drag hook measures). Returns `null` when the move would
 * be a no-op, so callers can skip a needless state update.
 */
export function moveRowBlock(
  rows: ListRow[],
  draggedId: string,
  targetIndex: number,
): ListRow[] | null {
  const range = rowBlockRange(rows, draggedId);
  if (!range) return null;
  const [start, end] = range;
  const block = rows.slice(start, end);
  const rest = [...rows.slice(0, start), ...rows.slice(end)];

  let insertAt = Math.min(Math.max(targetIndex, 0), rest.length);
  const leader = block[0];
  if (!isGuest(leader)) {
    // A heading only lands on a section boundary. Dropping one mid-section
    // would silently re-label everybody below the drop point.
    while (insertAt < rest.length && isGuest(rest[insertAt])) insertAt += 1;
  } else if (!leader.isPlusOne) {
    // A main guest may not land mid plus-one run, or it would adopt the
    // plus-ones sitting below it. A lone plus-one has no such risk.
    while (isPlusOneRow(rest[insertAt])) insertAt += 1;
  }
  if (insertAt === start) return null;

  const next = [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)];
  return enforcePlusOneParents(next);
}

/**
 * Make a guest a plus-one of the guest above, or promote them back. Refused
 * when there's no guest row directly above to belong to, and headings are
 * never indentable. Indenting a main guest that had plus-ones leaves those
 * rows attached to the earlier main guest — the flat model gives that for
 * free. Returns `null` on a no-op.
 */
export function setGuestIndent(
  rows: ListRow[],
  id: string,
  shouldBePlusOne: boolean,
): ListRow[] | null {
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  const row = rows[index];
  if (!isGuest(row) || row.isPlusOne === shouldBePlusOne) return null;
  if (shouldBePlusOne && (index === 0 || !isGuest(rows[index - 1]))) return null;
  const next = rows.slice();
  next[index] = { ...row, isPlusOne: shouldBePlusOne };
  return next;
}

/**
 * Append a guest to the end of a section — after its last member but before
 * the next heading. `headingId` of `null` targets the un-sectioned run at the
 * top of the list.
 */
export function appendGuestToSection(
  rows: ListRow[],
  headingId: string | null,
  guest: Guest,
): ListRow[] | null {
  let end: number;
  if (headingId === null) {
    const firstHeading = rows.findIndex((row) => !isGuest(row));
    end = firstHeading === -1 ? rows.length : firstHeading;
  } else {
    const range = rowBlockRange(rows, headingId);
    if (!range) return null;
    end = range[1];
  }
  return [...rows.slice(0, end), guest, ...rows.slice(end)];
}

/** Insert `row` directly below `afterId`. `null` when the anchor is unknown. */
export function insertRowAfter(
  rows: ListRow[],
  afterId: string,
  row: ListRow,
): ListRow[] | null {
  const index = rows.findIndex((existing) => existing.id === afterId);
  if (index === -1) return null;
  return enforcePlusOneParents([
    ...rows.slice(0, index + 1),
    row,
    ...rows.slice(index + 1),
  ]);
}

/**
 * Drop a row from the list. Removing a heading keeps its guests, which merge
 * into whatever section sits above. Removing a main guest promotes its
 * plus-ones — they're still real people, and re-parenting them onto whoever
 * now sits above would invent a relationship nobody asked for.
 */
export function removeRow(rows: ListRow[], id: string): ListRow[] | null {
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  const removed = rows[index];
  const next = [...rows.slice(0, index), ...rows.slice(index + 1)];
  if (!isGuest(removed)) return enforcePlusOneParents(next);
  if (removed.isPlusOne) return next;
  for (let cursor = index; cursor < next.length; cursor += 1) {
    const row = next[cursor];
    if (!isGuest(row) || !row.isPlusOne) break;
    next[cursor] = { ...row, isPlusOne: false };
  }
  return next;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const asBoolean = (value: unknown): boolean => value === true;

function normalizeRow(stored: unknown): ListRow | null {
  const record = asRecord(stored);
  if (!record) return null;
  const id = asString(record.id, "");
  if (!id) return null;
  if (record.kind === "heading") {
    return { kind: "heading", id, title: asString(record.title, "") };
  }
  // Saves written before sections existed have no `kind` — they're all guests.
  return {
    kind: "guest",
    id,
    name: asString(record.name, ""),
    isPlusOne: asBoolean(record.isPlusOne),
    hasConfirmed: asBoolean(record.hasConfirmed),
    hasArrived: asBoolean(record.hasArrived),
  };
}

function normalizeParty(stored: unknown): Party | null {
  const record = asRecord(stored);
  if (!record) return null;
  const id = asString(record.id, "");
  if (!id) return null;
  // `guests` is the pre-sections field name for the same array.
  const storedRows = record.rows ?? record.guests;
  const rows = (Array.isArray(storedRows) ? storedRows : [])
    .map(normalizeRow)
    .filter((row): row is ListRow => row !== null);
  return {
    id,
    name: asString(record.name, ""),
    rows: enforcePlusOneParents(rows),
    updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : 0,
  };
}

/**
 * Validate whatever came back out of `localStorage`: drop unusable entries,
 * backfill fields added since the save was written, re-assert the plus-one
 * invariant, and clear an `activeId` that no longer resolves to a party.
 */
export function normalizeGuestListState(
  stored: unknown,
  fallback: GuestListState,
): GuestListState {
  const record = asRecord(stored);
  if (!record || !Array.isArray(record.parties)) return fallback;
  const parties = record.parties
    .map(normalizeParty)
    .filter((party): party is Party => party !== null);
  const storedActiveId =
    typeof record.activeId === "string" ? record.activeId : null;
  const activeId = parties.some((party) => party.id === storedActiveId)
    ? storedActiveId
    : (parties[0]?.id ?? null);
  return { parties, activeId };
}
