/** How long the reset button stays in its "tap again to confirm" state. */
export const RESET_CONFIRM_TIMEOUT_MS = 3000;

/**
 * Minimum width, in percent, of a non-empty savings progress bar — so any
 * progress above zero is still visible as a sliver rather than nothing.
 */
export const MIN_VISIBLE_PROGRESS_PCT = 2;

/** Locale used for percentages shown in this tool. */
export const PERCENT_LOCALE = "fi";

/** Locale used for month/year labels shown in this tool. */
export const DATE_LOCALE = "fi";

/** Finnish unit labels for `formatDuration` ("3 v 4 kk"). */
export const FINNISH_DURATION_UNITS = { year: "v", month: "kk" } as const;
