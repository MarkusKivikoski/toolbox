// Finnish income-tax estimator — no React, fully unit-testable.
//
// Rough estimate by design: state tax + municipal tax + employee TyEL and
// unemployment contributions + the automatic tulonhankkimisvähennys, nothing
// else. Excludes the automatic tax credits (työtulovähennys, perusvähennys),
// health insurance contributions, Yle tax, church tax, itemized deductions and
// capital income — so it somewhat overstates the tax. All figures live in
// `lib/tax-bracket-visualizer.config.ts`; update that file yearly.

import {
  CUSTOM_RATE_DEFAULT_PERCENT,
  CUSTOM_RATE_MAX_PERCENT,
  CUSTOM_RATE_MIN_PERCENT,
  CUSTOM_MUNICIPALITY_ID,
  MUNICIPALITIES,
  PENSION_CONTRIBUTION_RATE_PERCENT,
  STATE_TAX_BRACKETS,
  UNEMPLOYMENT_INSURANCE_RATE_PERCENT,
  WAGE_INCOME_DEDUCTION_EUR,
} from "@/lib/tax-bracket-visualizer.config";
import { formatPercent } from "@/lib/format";

/** € step used for the finite-difference marginal rate — literally "the next €1". */
export const MARGINAL_STEP_EUR = 1;

const PERCENT_DIVISOR = 100;

export type StateBracketSlice = {
  bracketIndex: number;
  ratePercent: number;
  lowerBound: number;
  upperBound: number | null;
  /** Taxable € falling inside this bracket. */
  taxedAmount: number;
  /** State tax produced by this bracket: taxedAmount × rate. */
  tax: number;
};

export type TaxBreakdown = {
  grossAnnualIncome: number;
  municipalRatePercent: number;
  pensionContribution: number;
  unemploymentContribution: number;
  totalContributions: number;
  /** min(WAGE_INCOME_DEDUCTION_EUR, gross) actually applied. */
  appliedDeduction: number;
  /** max(0, gross − contributions − deduction). */
  taxableIncome: number;
  /** Only brackets with income in them. */
  stateBracketSlices: StateBracketSlice[];
  stateTax: number;
  municipalTax: number;
  /** state + municipal + contributions. */
  totalTax: number;
  netAnnual: number;
  netMonthly: number;
  /** totalTax / gross as a fraction; 0 when gross is 0. */
  effectiveRate: number;
  /** Tax on the next €1 of gross, as a fraction. */
  marginalRate: number;
};

const MONTHS_PER_YEAR = 12;

/** Split taxable income into the per-bracket slices the state tax comes from. */
export function computeStateBracketSlices(taxableIncome: number): StateBracketSlice[] {
  const slices: StateBracketSlice[] = [];
  STATE_TAX_BRACKETS.forEach((bracket, bracketIndex) => {
    const upper = bracket.upperBound ?? Infinity;
    const taxedAmount = Math.max(0, Math.min(taxableIncome, upper) - bracket.lowerBound);
    if (taxedAmount <= 0) return;
    slices.push({
      bracketIndex,
      ratePercent: bracket.ratePercent,
      lowerBound: bracket.lowerBound,
      upperBound: bracket.upperBound,
      taxedAmount,
      tax: (taxedAmount * bracket.ratePercent) / PERCENT_DIVISOR,
    });
  });
  return slices;
}

type TaxTotals = {
  pensionContribution: number;
  unemploymentContribution: number;
  totalContributions: number;
  appliedDeduction: number;
  taxableIncome: number;
  stateBracketSlices: StateBracketSlice[];
  stateTax: number;
  municipalTax: number;
  totalTax: number;
};

/** Everything except the marginal rate — reused by the finite difference. */
function computeTotals(grossAnnualIncome: number, municipalRatePercent: number): TaxTotals {
  const pensionContribution =
    (grossAnnualIncome * PENSION_CONTRIBUTION_RATE_PERCENT) / PERCENT_DIVISOR;
  const unemploymentContribution =
    (grossAnnualIncome * UNEMPLOYMENT_INSURANCE_RATE_PERCENT) / PERCENT_DIVISOR;
  const totalContributions = pensionContribution + unemploymentContribution;
  const appliedDeduction = Math.min(WAGE_INCOME_DEDUCTION_EUR, grossAnnualIncome);
  const taxableIncome = Math.max(
    0,
    grossAnnualIncome - totalContributions - appliedDeduction,
  );
  const stateBracketSlices = computeStateBracketSlices(taxableIncome);
  const stateTax = stateBracketSlices.reduce((sum, slice) => sum + slice.tax, 0);
  const municipalTax = (taxableIncome * municipalRatePercent) / PERCENT_DIVISOR;
  return {
    pensionContribution,
    unemploymentContribution,
    totalContributions,
    appliedDeduction,
    taxableIncome,
    stateBracketSlices,
    stateTax,
    municipalTax,
    totalTax: stateTax + municipalTax + totalContributions,
  };
}

/**
 * The full estimate for one gross annual salary and municipal rate.
 *
 * The marginal rate is a finite difference — the tax on the next €1 of gross —
 * so the deduction cap, the taxable-income floor and bracket crossings all
 * fall out of the same code path. Mid-bracket it matches the analytic form
 * `contribRate + (1 − contribRate) × (stateMarginal + municipalRate)`: an
 * extra €1 of gross adds €0.0819 of contributions and only €0.9181 of taxable
 * income.
 */
export function computeTaxBreakdown(
  grossAnnualIncome: number,
  municipalRatePercent: number,
): TaxBreakdown {
  const totals = computeTotals(grossAnnualIncome, municipalRatePercent);
  const nextTotals = computeTotals(
    grossAnnualIncome + MARGINAL_STEP_EUR,
    municipalRatePercent,
  );
  const netAnnual = grossAnnualIncome - totals.totalTax;
  return {
    grossAnnualIncome,
    municipalRatePercent,
    ...totals,
    netAnnual,
    netMonthly: netAnnual / MONTHS_PER_YEAR,
    effectiveRate: grossAnnualIncome > 0 ? totals.totalTax / grossAnnualIncome : 0,
    marginalRate: (nextTotals.totalTax - totals.totalTax) / MARGINAL_STEP_EUR,
  };
}

export type RaiseImpact = {
  raiseAmount: number;
  extraTax: number;
  extraNet: number;
  /** extraTax / raiseAmount, as a fraction. */
  taxShare: number;
  keptShare: number;
};

/**
 * What a raise or bonus actually leaves in hand: the difference of two full
 * breakdowns, so a raise spanning several brackets is handled exactly.
 */
export function computeRaiseImpact(
  currentGross: number,
  raiseAmount: number,
  municipalRatePercent: number,
): RaiseImpact {
  const before = computeTotals(currentGross, municipalRatePercent);
  const after = computeTotals(currentGross + raiseAmount, municipalRatePercent);
  const extraTax = after.totalTax - before.totalTax;
  const extraNet = raiseAmount - extraTax;
  const taxShare = raiseAmount > 0 ? extraTax / raiseAmount : 0;
  return { raiseAmount, extraTax, extraNet, taxShare, keptShare: 1 - taxShare };
}

// --- Bar segments: a partition of gross into "where each euro goes" ---------

export type SegmentKind = "contributions" | "state" | "municipal" | "net";

export type GrossAllocationSegment = {
  /** "contributions" | "state-0".."state-4" | "municipal" | "net". */
  id: string;
  kind: SegmentKind;
  label: string;
  /** € of gross landing in this segment. */
  amount: number;
  /** amount / gross, 0–1. */
  fraction: number;
  /** State segments only: the taxable € the tax came from — for the caption. */
  taxedBase: number | null;
  ratePercent: number | null;
};

/** Fixed fill per segment id, drawn from the shared slice palette. */
export const SEGMENT_COLORS: Record<string, string> = {
  contributions: "#8b5cf6", // violet
  "state-0": "#f59e0b", // amber — brackets warm up with the rate
  "state-1": "#f97316", // orange
  "state-2": "#f43f5e", // rose
  "state-3": "#d946ef", // fuchsia
  "state-4": "#ec4899", // pink
  municipal: "#0ea5e9", // sky
  net: "#10b981", // emerald — what you keep
};

const percentLabel = (ratePercent: number): string =>
  formatPercent(ratePercent / PERCENT_DIVISOR, {
    maximumFractionDigits: 2,
    locale: "fi-FI",
  });

/**
 * Partition gross pay into bar segments: contributions, each state bracket's
 * tax, municipal tax and the net remainder. The amounts sum exactly to gross.
 */
export function computeGrossAllocation(breakdown: TaxBreakdown): GrossAllocationSegment[] {
  const gross = breakdown.grossAnnualIncome;
  const fractionOfGross = (amount: number) => (gross > 0 ? amount / gross : 0);
  const segments: GrossAllocationSegment[] = [];

  if (breakdown.totalContributions > 0) {
    segments.push({
      id: "contributions",
      kind: "contributions",
      label: "TyEL + unemployment",
      amount: breakdown.totalContributions,
      fraction: fractionOfGross(breakdown.totalContributions),
      taxedBase: null,
      ratePercent: PENSION_CONTRIBUTION_RATE_PERCENT + UNEMPLOYMENT_INSURANCE_RATE_PERCENT,
    });
  }

  for (const slice of breakdown.stateBracketSlices) {
    segments.push({
      id: `state-${slice.bracketIndex}`,
      kind: "state",
      label: `State tax ${percentLabel(slice.ratePercent)}`,
      amount: slice.tax,
      fraction: fractionOfGross(slice.tax),
      taxedBase: slice.taxedAmount,
      ratePercent: slice.ratePercent,
    });
  }

  if (breakdown.municipalTax > 0) {
    segments.push({
      id: "municipal",
      kind: "municipal",
      label: "Municipal tax",
      amount: breakdown.municipalTax,
      fraction: fractionOfGross(breakdown.municipalTax),
      taxedBase: breakdown.taxableIncome,
      ratePercent: breakdown.municipalRatePercent,
    });
  }

  if (breakdown.netAnnual > 0) {
    segments.push({
      id: "net",
      kind: "net",
      label: "Net pay",
      amount: breakdown.netAnnual,
      fraction: fractionOfGross(breakdown.netAnnual),
      taxedBase: null,
      ratePercent: null,
    });
  }

  return segments;
}

// --- Persisted UI state ------------------------------------------------------

export type TaxToolState = {
  /** Free-typed gross annual salary, kept as a string so partial input survives. */
  grossAnnualIncome: string;
  /** A `MUNICIPALITIES` id, or `CUSTOM_MUNICIPALITY_ID`. */
  municipalityId: string;
  /** Percent; only used when `municipalityId` is custom. */
  customRatePercent: number;
  /** Free-typed raise amount for the what-if panel. */
  raiseAmount: string;
};

/** Backfill a stored state so older or hand-edited saves don't crash on load. */
export function normalizeTaxToolState(stored: unknown, fallback: TaxToolState): TaxToolState {
  const partial = (stored ?? {}) as Partial<TaxToolState>;
  const municipalityId =
    typeof partial.municipalityId === "string" &&
    (partial.municipalityId === CUSTOM_MUNICIPALITY_ID ||
      MUNICIPALITIES.some((municipality) => municipality.id === partial.municipalityId))
      ? partial.municipalityId
      : fallback.municipalityId;
  const customRatePercent =
    typeof partial.customRatePercent === "number" && Number.isFinite(partial.customRatePercent)
      ? Math.min(
          CUSTOM_RATE_MAX_PERCENT,
          Math.max(CUSTOM_RATE_MIN_PERCENT, partial.customRatePercent),
        )
      : CUSTOM_RATE_DEFAULT_PERCENT;
  return {
    grossAnnualIncome:
      typeof partial.grossAnnualIncome === "string"
        ? partial.grossAnnualIncome
        : fallback.grossAnnualIncome,
    municipalityId,
    customRatePercent,
    raiseAmount: typeof partial.raiseAmount === "string" ? partial.raiseAmount : fallback.raiseAmount,
  };
}

/** The municipal rate the estimator should use for a given persisted state. */
export function municipalRateForState(state: TaxToolState): number {
  if (state.municipalityId === CUSTOM_MUNICIPALITY_ID) return state.customRatePercent;
  const municipality = MUNICIPALITIES.find(
    (candidate) => candidate.id === state.municipalityId,
  );
  return municipality ? municipality.ratePercent : CUSTOM_RATE_DEFAULT_PERCENT;
}
