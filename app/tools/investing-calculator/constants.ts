// Storage keys follow the toolbox.<slug>.<purpose>.v<n> convention.
export const DRAFT_STORAGE_KEY = "toolbox.investing-calculator.draft.v1";
/** Pre-convention key (no <purpose> segment); read once so existing saves survive
 *  the rename to DRAFT_STORAGE_KEY. */
export const LEGACY_DRAFT_STORAGE_KEY = "toolbox.investing-calculator.v1";

// A freshly added contribution phase starts here until the user edits it.
export const NEW_PHASE_DEFAULT_YEARS = 5;
export const NEW_PHASE_DEFAULT_CONTRIBUTION = 100;

// Export files are named investing-calculator-YYYY-MM-DD.<ext>.
export const EXPORT_FILENAME_BASE = "investing-calculator";
