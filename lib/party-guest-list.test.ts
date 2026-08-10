import { describe, it, expect } from "vitest";
import {
  appendGuestToSection,
  countGuests,
  groupRowsBySection,
  insertRowAfter,
  moveRowBlock,
  normalizeGuestListState,
  previousBlockIndex,
  removeRow,
  rowBlockRange,
  setGuestIndent,
  DEFAULT_GUEST_LIST_STATE,
  type Guest,
  type Heading,
  type ListRow,
} from "@/lib/party-guest-list";

const guest = (id: string, isPlusOne = false): Guest => ({
  kind: "guest",
  id,
  name: id,
  isPlusOne,
  hasConfirmed: false,
  hasArrived: false,
});

const heading = (id: string): Heading => ({ kind: "heading", id, title: id });

/** Anna + her plus-one, Ben, then Cara — no sections. */
const sampleRows = (): ListRow[] => [
  guest("anna"),
  guest("anna-plus", true),
  guest("ben"),
  guest("cara"),
];

/** Two sections: Work holds Anna and Ben, Family holds Cara. */
const sectionedRows = (): ListRow[] => [
  heading("work"),
  guest("anna"),
  guest("ben"),
  heading("family"),
  guest("cara"),
];

const idsOf = (rows: ListRow[]) => rows.map((row) => row.id);

describe("countGuests", () => {
  it("counts plus-ones in the total but separately from main guests", () => {
    const counts = countGuests(sampleRows());
    expect(counts.total).toBe(4);
    expect(counts.mainGuests).toBe(3);
    expect(counts.plusOnes).toBe(1);
  });

  it("ignores heading rows", () => {
    const counts = countGuests(sectionedRows());
    expect(counts.total).toBe(3);
    expect(counts.mainGuests).toBe(3);
  });

  it("counts the two ticks independently", () => {
    const counts = countGuests([
      { ...guest("anna"), hasConfirmed: true, hasArrived: true },
      { ...guest("ben"), hasConfirmed: true },
      { ...guest("cara"), hasArrived: true },
    ]);
    expect(counts.confirmed).toBe(2);
    expect(counts.arrived).toBe(2);
  });

  it("zeroes out on an empty list", () => {
    expect(countGuests([])).toEqual({
      total: 0,
      confirmed: 0,
      arrived: 0,
      mainGuests: 0,
      plusOnes: 0,
    });
  });
});

describe("groupRowsBySection", () => {
  it("keeps a leading un-sectioned run as its own group", () => {
    const groups = groupRowsBySection([guest("solo"), ...sectionedRows()]);
    expect(groups.map((group) => group.heading?.id ?? null)).toEqual([
      null,
      "work",
      "family",
    ]);
    expect(idsOf(groups[0].guests)).toEqual(["solo"]);
  });

  it("drops the empty leading group when the list starts with a heading", () => {
    const groups = groupRowsBySection(sectionedRows());
    expect(groups.map((group) => group.heading?.id)).toEqual(["work", "family"]);
    expect(idsOf(groups[0].guests)).toEqual(["anna", "ben"]);
  });

  it("still yields one group for an empty list, so there's somewhere to add", () => {
    expect(groupRowsBySection([])).toEqual([{ heading: null, guests: [] }]);
  });
});

describe("rowBlockRange", () => {
  it("covers a main guest and its trailing plus-ones", () => {
    expect(rowBlockRange(sampleRows(), "anna")).toEqual([0, 2]);
  });

  it("covers a plus-one alone", () => {
    expect(rowBlockRange(sampleRows(), "anna-plus")).toEqual([1, 2]);
  });

  it("covers a heading and its whole section", () => {
    expect(rowBlockRange(sectionedRows(), "work")).toEqual([0, 3]);
  });

  it("stops a main guest's block at the next heading", () => {
    expect(rowBlockRange(sectionedRows(), "ben")).toEqual([2, 3]);
  });

  it("returns null for an unknown id", () => {
    expect(rowBlockRange(sampleRows(), "nobody")).toBeNull();
  });
});

describe("moveRowBlock", () => {
  it("carries plus-ones along with their main guest", () => {
    const moved = moveRowBlock(sampleRows(), "anna", 2);
    expect(idsOf(moved!)).toEqual(["ben", "cara", "anna", "anna-plus"]);
  });

  it("snaps a main guest past a plus-one run rather than splitting it", () => {
    // Dropping Cara at index 1 would land her between Anna and her plus-one.
    const moved = moveRowBlock(sampleRows(), "cara", 1);
    expect(idsOf(moved!)).toEqual(["anna", "anna-plus", "cara", "ben"]);
  });

  it("lets a plus-one land exactly where it was dropped", () => {
    const moved = moveRowBlock(sampleRows(), "anna-plus", 2);
    expect(idsOf(moved!)).toEqual(["anna", "ben", "anna-plus", "cara"]);
  });

  it("promotes a plus-one dragged to the top of the list", () => {
    const moved = moveRowBlock(sampleRows(), "anna-plus", 0);
    expect(moved![0].id).toBe("anna-plus");
    expect((moved![0] as Guest).isPlusOne).toBe(false);
  });

  it("carries a whole section when its heading is dragged", () => {
    const moved = moveRowBlock(sectionedRows(), "family", 0);
    expect(idsOf(moved!)).toEqual(["family", "cara", "work", "anna", "ben"]);
  });

  it("refuses to drop a heading inside another section", () => {
    // Index 1 is between Anna and Ben — landing there would relabel Ben, so the
    // snap walks Family forward to the boundary it started from: no move.
    expect(moveRowBlock(sectionedRows(), "family", 1)).toBeNull();
  });

  it("returns null when the block does not actually move", () => {
    expect(moveRowBlock(sampleRows(), "anna", 0)).toBeNull();
  });

  it("returns null for an unknown id", () => {
    expect(moveRowBlock(sampleRows(), "nobody", 1)).toBeNull();
  });
});

describe("previousBlockIndex", () => {
  it("hops a main guest over the whole block above it", () => {
    // Ben sits below Anna's plus-one, so moving up must clear both.
    const target = previousBlockIndex(sampleRows(), "ben");
    expect(idsOf(moveRowBlock(sampleRows(), "ben", target!)!)).toEqual([
      "ben",
      "anna",
      "anna-plus",
      "cara",
    ]);
  });

  it("steps a plus-one up one row so it can be reordered within its run", () => {
    const rows = [guest("anna"), guest("first", true), guest("second", true)];
    const target = previousBlockIndex(rows, "second");
    expect(idsOf(moveRowBlock(rows, "second", target!)!)).toEqual([
      "anna",
      "second",
      "first",
    ]);
  });

  it("hops a heading over the whole section above it", () => {
    const target = previousBlockIndex(sectionedRows(), "family");
    expect(idsOf(moveRowBlock(sectionedRows(), "family", target!)!)).toEqual([
      "family",
      "cara",
      "work",
      "anna",
      "ben",
    ]);
  });

  it("moves a guest into the section above when it is first in its own", () => {
    const target = previousBlockIndex(sectionedRows(), "cara");
    expect(idsOf(moveRowBlock(sectionedRows(), "cara", target!)!)).toEqual([
      "work",
      "anna",
      "ben",
      "cara",
      "family",
    ]);
  });

  it("returns null at the top of the list", () => {
    expect(previousBlockIndex(sampleRows(), "anna")).toBeNull();
  });
});

describe("setGuestIndent", () => {
  it("indents a main guest", () => {
    const next = setGuestIndent(sampleRows(), "ben", true);
    expect((next!.find((row) => row.id === "ben") as Guest).isPlusOne).toBe(true);
  });

  it("refuses to indent the first guest", () => {
    expect(setGuestIndent(sampleRows(), "anna", true)).toBeNull();
  });

  it("refuses to indent a guest sitting directly under a heading", () => {
    expect(setGuestIndent(sectionedRows(), "anna", true)).toBeNull();
  });

  it("allows the second guest in a section", () => {
    const next = setGuestIndent(sectionedRows(), "ben", true);
    expect((next!.find((row) => row.id === "ben") as Guest).isPlusOne).toBe(true);
  });

  it("refuses to indent a heading", () => {
    expect(setGuestIndent(sectionedRows(), "work", true)).toBeNull();
  });

  it("outdents a plus-one", () => {
    const next = setGuestIndent(sampleRows(), "anna-plus", false);
    expect((next!.find((row) => row.id === "anna-plus") as Guest).isPlusOne).toBe(
      false,
    );
  });

  it("returns null when the flag already matches", () => {
    expect(setGuestIndent(sampleRows(), "ben", false)).toBeNull();
  });
});

describe("appendGuestToSection", () => {
  it("adds to the end of a section, before the next heading", () => {
    const next = appendGuestToSection(sectionedRows(), "work", guest("new"));
    expect(idsOf(next!)).toEqual(["work", "anna", "ben", "new", "family", "cara"]);
  });

  it("adds to the end of the un-sectioned run when given no heading", () => {
    const next = appendGuestToSection(
      [guest("solo"), ...sectionedRows()],
      null,
      guest("new"),
    );
    expect(idsOf(next!)).toEqual([
      "solo",
      "new",
      "work",
      "anna",
      "ben",
      "family",
      "cara",
    ]);
  });

  it("appends to a flat list when there are no headings at all", () => {
    const next = appendGuestToSection(sampleRows(), null, guest("new"));
    expect(idsOf(next!)).toEqual(["anna", "anna-plus", "ben", "cara", "new"]);
  });

  it("returns null for an unknown heading", () => {
    expect(appendGuestToSection(sampleRows(), "nope", guest("new"))).toBeNull();
  });
});

describe("insertRowAfter", () => {
  it("slots a new guest directly below the anchor", () => {
    const next = insertRowAfter(sampleRows(), "anna-plus", guest("new"));
    expect(idsOf(next!)).toEqual(["anna", "anna-plus", "new", "ben", "cara"]);
  });

  it("keeps a new guest inside its section", () => {
    const next = insertRowAfter(sectionedRows(), "work", guest("new"));
    expect(idsOf(next!)).toEqual(["work", "new", "anna", "ben", "family", "cara"]);
  });

  it("promotes a plus-one inserted straight under a heading", () => {
    const next = insertRowAfter(sectionedRows(), "work", guest("new", true));
    expect((next![1] as Guest).isPlusOne).toBe(false);
  });

  it("promotes a plus-one cut off by a heading inserted above it", () => {
    const next = insertRowAfter(sampleRows(), "anna", heading("work"));
    expect(idsOf(next!)).toEqual(["anna", "work", "anna-plus", "ben", "cara"]);
    expect((next![2] as Guest).isPlusOne).toBe(false);
  });

  it("returns null for an unknown anchor", () => {
    expect(insertRowAfter(sampleRows(), "nobody", guest("new"))).toBeNull();
  });
});

describe("removeRow", () => {
  it("promotes the plus-ones of a removed main guest", () => {
    const next = removeRow(sampleRows(), "anna");
    expect(idsOf(next!)).toEqual(["anna-plus", "ben", "cara"]);
    expect(next!.every((row) => !(row as Guest).isPlusOne)).toBe(true);
  });

  it("leaves the rest alone when removing a plus-one", () => {
    const next = removeRow(sampleRows(), "anna-plus");
    expect(idsOf(next!)).toEqual(["anna", "ben", "cara"]);
  });

  it("keeps a removed heading's guests, merging them upward", () => {
    const next = removeRow(sectionedRows(), "family");
    expect(idsOf(next!)).toEqual(["work", "anna", "ben", "cara"]);
  });

  it("promotes a plus-one left at the top by removing the heading above it", () => {
    const rows: ListRow[] = [heading("work"), guest("anna"), guest("plus", true)];
    const next = removeRow(rows, "work");
    expect(idsOf(next!)).toEqual(["anna", "plus"]);
    expect((next![1] as Guest).isPlusOne).toBe(true);
  });

  it("returns null for an unknown id", () => {
    expect(removeRow(sampleRows(), "nobody")).toBeNull();
  });
});

describe("normalizeGuestListState", () => {
  const party = (id: string, rows: unknown[]) => ({
    id,
    name: id,
    rows,
    updatedAt: 1,
  });

  it("falls back on junk", () => {
    expect(normalizeGuestListState(null, DEFAULT_GUEST_LIST_STATE)).toBe(
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(normalizeGuestListState({ parties: "nope" }, DEFAULT_GUEST_LIST_STATE)).toBe(
      DEFAULT_GUEST_LIST_STATE,
    );
  });

  it("reads a pre-sections save from its `guests` field", () => {
    const state = normalizeGuestListState(
      {
        parties: [
          { id: "p1", name: "p1", updatedAt: 1, guests: [{ id: "anna", name: "Anna" }] },
        ],
        activeId: "p1",
      },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(state.parties[0].rows).toEqual([
      {
        kind: "guest",
        id: "anna",
        name: "Anna",
        isPlusOne: false,
        hasConfirmed: false,
        hasArrived: false,
      },
    ]);
  });

  it("restores heading rows", () => {
    const state = normalizeGuestListState(
      {
        parties: [
          party("p1", [{ kind: "heading", id: "work", title: "Colleagues" }]),
        ],
        activeId: "p1",
      },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(state.parties[0].rows[0]).toEqual({
      kind: "heading",
      id: "work",
      title: "Colleagues",
    });
  });

  it("promotes a stored plus-one that has no guest above it", () => {
    const state = normalizeGuestListState(
      {
        parties: [
          party("p1", [
            { kind: "heading", id: "work", title: "Work" },
            { id: "anna", isPlusOne: true },
          ]),
        ],
        activeId: "p1",
      },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect((state.parties[0].rows[1] as Guest).isPlusOne).toBe(false);
  });

  it("drops rows without an id", () => {
    const state = normalizeGuestListState(
      { parties: [party("p1", [{ name: "Ghost" }, { id: "anna" }])], activeId: "p1" },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(idsOf(state.parties[0].rows)).toEqual(["anna"]);
  });

  it("falls back to the first party when activeId no longer resolves", () => {
    const state = normalizeGuestListState(
      { parties: [party("p1", []), party("p2", [])], activeId: "deleted" },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(state.activeId).toBe("p1");
  });

  it("leaves activeId null when there are no parties", () => {
    const state = normalizeGuestListState(
      { parties: [], activeId: "p1" },
      DEFAULT_GUEST_LIST_STATE,
    );
    expect(state.activeId).toBeNull();
  });
});
