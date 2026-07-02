import type { TaxToolState } from "@/lib/tax-bracket-visualizer";
import { CUSTOM_RATE_DEFAULT_PERCENT } from "@/lib/tax-bracket-visualizer.config";

/** The salary slider tops out here; the text field accepts anything beyond. */
export const SALARY_SLIDER_MAX_EUR = 200_000;
export const SALARY_SLIDER_STEP_EUR = 500;

/** Non-zero segments narrower than this still get a visible sliver. */
export const MIN_SEGMENT_WIDTH_PX = 3;

export const DEFAULT_STATE: TaxToolState = {
  grossAnnualIncome: "45000",
  municipalityId: "helsinki",
  customRatePercent: CUSTOM_RATE_DEFAULT_PERCENT,
  raiseAmount: "",
};
