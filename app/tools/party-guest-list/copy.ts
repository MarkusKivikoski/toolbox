export const DEFAULT_PARTY_NAME = "My party";

export const COPY = {
  guestsHeading: "Guests",
  namePlaceholder: "Guest name…",
  fallbackGuestNoun: "this guest",
  addGuest: "+ Add guest",
  addSection: "+ Add section",
  sectionTitlePlaceholder: "Section title…",
  fallbackSectionNoun: "this section",
  untitledSection: "Untitled section",
  emptySection: "Nobody in this section yet.",
  emptyGuests:
    "No guests yet. Add a name, then drag it right to make them someone's plus-one.",
  partiesHeading: "My parties",
  newParty: "+ New party",
  partyNamePlaceholder: "Name this party…",
  noParties: "No parties yet — add a guest and one will be started for you.",
  dragHint:
    "Press Enter in a name to open the next one. Drag a handle to reorder, or sideways to make a guest a plus-one; dragging a section title moves the whole group. With a keyboard: arrow up/down to move, right/left to indent.",
  privacyNote:
    "Everything stays in your browser — nothing is uploaded. Each party keeps its own list.",
} as const;

/** Column labels above the two tick boxes. */
export const TICK_COLUMNS = {
  confirmed: { short: "Yes", label: "confirmed" },
  arrived: { short: "Here", label: "arrived" },
} as const;

/** Tick styling per column, so the two states stay visually distinct. */
export const TICK_TONE = {
  confirmed:
    "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-500 dark:bg-emerald-500",
  arrived: "border-sky-500 bg-sky-500 text-white dark:border-sky-500 dark:bg-sky-500",
} as const;

// `group-hover` because the hoverable target is the button wrapping this box.
export const TICK_TONE_OFF =
  "border-zinc-300 bg-white text-transparent group-hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:group-hover:border-zinc-600";
