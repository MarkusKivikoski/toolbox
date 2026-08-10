export const STORAGE_KEY = "toolbox.party-guest-list.state.v1";

/** How far right the pointer must travel off the grip before a row indents. */
export const INDENT_DRAG_THRESHOLD_PX = 28;

/** Left offset applied to a plus-one row, matching the grip column width. */
export const PLUS_ONE_INDENT_CLASS = "ml-7";

/** A party delete reverts to its unarmed state if the second tap never comes. */
export const DELETE_CONFIRM_TIMEOUT_MS = 3000;

/** Room for a long name without letting one guest blow out the layout. */
export const MAX_NAME_LENGTH = 60;

/** Grip · confirmed tick · arrived tick · name · remove. Shared by the rows
 *  and the column-label strip above them so the two stay aligned. */
export const ROW_GRID_CLASS =
  "grid grid-cols-[1.25rem_2.25rem_2.25rem_1fr_2.25rem] items-center gap-2";

/** A heading has no ticks, so its title runs across those two columns. */
export const HEADING_TITLE_SPAN_CLASS = "col-span-3";

/** Gap above a section heading, so groups read as separate blocks. */
export const SECTION_SPACING_CLASS = "mt-6 first:mt-0";
