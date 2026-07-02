// Tunables for the cost-of-living tool. See PurchasingPowerChart for how the
// chart geometry constants are applied.

/** Buying-power swings below this (in later-year euros) read as "held steady". */
export const SALARY_CHANGE_EPSILON_EUR = 0.5;

// --- Purchasing-power chart -------------------------------------------------

/** Below this width the chart switches to its compact layout (shorter, tighter padding). */
export const COMPACT_BREAKPOINT_PX = 480;

/**
 * A deliberately smaller threshold than COMPACT_BREAKPOINT_PX, governing only how
 * many year ticks the x-axis shows. Kept separate so narrowing the axis density
 * doesn't drag the whole compact layout with it.
 */
export const XTICK_BREAKPOINT_PX = 420;

export const CHART_HEIGHT_COMPACT = 200;
export const CHART_HEIGHT_DEFAULT = 240;

export const CHART_PAD_TOP = 18;
export const CHART_PAD_RIGHT = 16;
export const CHART_PAD_BOTTOM = 28;
export const CHART_PAD_LEFT_COMPACT = 46;
export const CHART_PAD_LEFT_DEFAULT = 58;

/** Horizontal gridlines / y-axis ticks drawn across the plot. */
export const Y_AXIS_TICK_COUNT = 4;

/** Target number of year labels on the x-axis, by available width. */
export const X_TICKS_NARROW = 4;
export const X_TICKS_WIDE = 6;

/** Drop the penultimate x tick if it lands within this fraction of a step of the last. */
export const TICK_CROWDING_FACTOR = 0.6;

export const DOT_RADIUS = 4.5;
export const ACTIVE_DOT_RADIUS = 5;
