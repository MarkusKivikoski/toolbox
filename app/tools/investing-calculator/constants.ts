import type { WithdrawalBasis, WithdrawalMode } from "@/lib/investing";
import type { SegmentedToggleOption } from "./components/SegmentedToggle";

// Storage keys follow the toolbox.<slug>.<purpose>.v<n> convention.
export const DRAFT_STORAGE_KEY = "toolbox.investing-calculator.draft.v1";
/** Pre-convention key (no <purpose> segment); read once so existing saves survive
 *  the rename to DRAFT_STORAGE_KEY. */
export const LEGACY_DRAFT_STORAGE_KEY = "toolbox.investing-calculator.v1";
export const SAVED_STORAGE_KEY = "toolbox.investing-calculator.saved.v1";

// Copy for the retirement segmented toggles.
export const WITHDRAWAL_MODE_OPTIONS: readonly SegmentedToggleOption<WithdrawalMode>[] =
  [
    { value: "fixed", label: "Fixed amount" },
    { value: "spendDown", label: "Spend it all" },
  ];
export const AMOUNT_BASIS_OPTIONS: readonly SegmentedToggleOption<WithdrawalBasis>[] =
  [
    { value: "net", label: "Net (after tax)" },
    { value: "gross", label: "Gross (pre-tax)" },
  ];

// A freshly added contribution phase starts here until the user edits it.
export const NEW_PHASE_DEFAULT_YEARS = 5;
export const NEW_PHASE_DEFAULT_CONTRIBUTION = 100;

// Export files are named investing-calculator-YYYY-MM-DD.<ext>.
export const EXPORT_FILENAME_BASE = "investing-calculator";
