import { describe, expect, it } from "vitest";
import {
  computeGrossAllocation,
  computeRaiseImpact,
  computeStateBracketSlices,
  computeTaxBreakdown,
  municipalRateForState,
  normalizeTaxToolState,
  type TaxToolState,
} from "@/lib/tax-bracket-visualizer";
import {
  CUSTOM_MUNICIPALITY_ID,
  CUSTOM_RATE_DEFAULT_PERCENT,
  CUSTOM_RATE_MAX_PERCENT,
  CUSTOM_RATE_MIN_PERCENT,
} from "@/lib/tax-bracket-visualizer.config";

const HELSINKI_RATE_PERCENT = 5.3;

const FALLBACK_STATE: TaxToolState = {
  grossAnnualIncome: "45000",
  municipalityId: "helsinki",
  customRatePercent: CUSTOM_RATE_DEFAULT_PERCENT,
  raiseAmount: "",
};

describe("computeStateBracketSlices", () => {
  it("matches the published cumulative tax at each 2026 bracket boundary", () => {
    const taxAt = (taxableIncome: number) =>
      computeStateBracketSlices(taxableIncome).reduce((sum, slice) => sum + slice.tax, 0);
    expect(taxAt(22_000)).toBeCloseTo(2_780.8, 2);
    expect(taxAt(32_600)).toBeCloseTo(4_794.8, 2);
    expect(taxAt(40_100)).toBeCloseTo(7_063.55, 2);
    expect(taxAt(52_100)).toBeCloseTo(11_053.55, 2);
  });

  it("only returns brackets with income in them", () => {
    const slices = computeStateBracketSlices(25_000);
    expect(slices).toHaveLength(2);
    expect(slices[0].taxedAmount).toBe(22_000);
    expect(slices[1].taxedAmount).toBe(3_000);
  });

  it("returns no slices for zero taxable income", () => {
    expect(computeStateBracketSlices(0)).toHaveLength(0);
  });
});

describe("computeTaxBreakdown", () => {
  it("reproduces the hand-verified €30,000 Helsinki example", () => {
    const breakdown = computeTaxBreakdown(30_000, HELSINKI_RATE_PERCENT);
    expect(breakdown.totalContributions).toBeCloseTo(2_457, 2);
    expect(breakdown.taxableIncome).toBeCloseTo(26_793, 2);
    expect(breakdown.stateTax).toBeCloseTo(3_691.47, 2);
    expect(breakdown.municipalTax).toBeCloseTo(1_420.03, 2);
    expect(breakdown.totalTax).toBeCloseTo(7_568.5, 2);
    expect(breakdown.netAnnual).toBeCloseTo(22_431.5, 2);
    expect(breakdown.netMonthly).toBeCloseTo(22_431.5 / 12, 2);
    expect(breakdown.effectiveRate).toBeCloseTo(0.2523, 4);
  });

  it("returns all zeros without NaN for zero gross", () => {
    const breakdown = computeTaxBreakdown(0, HELSINKI_RATE_PERCENT);
    expect(breakdown.taxableIncome).toBe(0);
    expect(breakdown.totalTax).toBe(0);
    expect(breakdown.netAnnual).toBe(0);
    expect(breakdown.netMonthly).toBe(0);
    expect(breakdown.effectiveRate).toBe(0);
    expect(breakdown.stateBracketSlices).toHaveLength(0);
    expect(Number.isFinite(breakdown.marginalRate)).toBe(true);
  });

  it("caps the wage income deduction below €750 of gross", () => {
    const breakdown = computeTaxBreakdown(500, HELSINKI_RATE_PERCENT);
    expect(breakdown.appliedDeduction).toBe(500);
    expect(breakdown.taxableIncome).toBe(0);
    // Only the contributions tax the next euro when taxable income floors at 0.
    expect(breakdown.marginalRate).toBeCloseTo(0.0819, 4);
  });

  it("matches the analytic marginal rate mid-bracket", () => {
    // €45,000 gross in Helsinki: taxable ≈ €40,564.5, inside the 33.25 % bracket.
    const breakdown = computeTaxBreakdown(45_000, HELSINKI_RATE_PERCENT);
    const analytic = 0.0819 + (1 - 0.0819) * (0.3325 + 0.053);
    expect(breakdown.marginalRate).toBeCloseTo(analytic, 6);
  });

  it("has an effective rate below the marginal rate for a typical salary", () => {
    const breakdown = computeTaxBreakdown(50_000, HELSINKI_RATE_PERCENT);
    expect(breakdown.effectiveRate).toBeLessThan(breakdown.marginalRate);
  });
});

describe("computeRaiseImpact", () => {
  it("equals the difference of two full breakdowns across brackets", () => {
    const before = computeTaxBreakdown(30_000, HELSINKI_RATE_PERCENT);
    const after = computeTaxBreakdown(60_000, HELSINKI_RATE_PERCENT);
    const impact = computeRaiseImpact(30_000, 30_000, HELSINKI_RATE_PERCENT);
    expect(impact.extraTax).toBeCloseTo(after.totalTax - before.totalTax, 6);
    expect(impact.extraNet).toBeCloseTo(30_000 - impact.extraTax, 6);
    expect(impact.taxShare + impact.keptShare).toBeCloseTo(1, 9);
  });

  it("handles a zero raise without NaN", () => {
    const impact = computeRaiseImpact(30_000, 0, HELSINKI_RATE_PERCENT);
    expect(impact.extraTax).toBe(0);
    expect(impact.taxShare).toBe(0);
    expect(impact.keptShare).toBe(1);
  });
});

describe("computeGrossAllocation", () => {
  it("partitions gross exactly into contributions, taxes and net", () => {
    const breakdown = computeTaxBreakdown(45_000, HELSINKI_RATE_PERCENT);
    const segments = computeGrossAllocation(breakdown);
    const totalAmount = segments.reduce((sum, segment) => sum + segment.amount, 0);
    const totalFraction = segments.reduce((sum, segment) => sum + segment.fraction, 0);
    expect(totalAmount).toBeCloseTo(45_000, 6);
    expect(totalFraction).toBeCloseTo(1, 9);
    // €45,000 gross → taxable ≈ €40,564.5, so four state brackets are in play.
    expect(segments.map((segment) => segment.id)).toEqual([
      "contributions",
      "state-0",
      "state-1",
      "state-2",
      "state-3",
      "municipal",
      "net",
    ]);
  });

  it("returns no segments for zero gross", () => {
    const segments = computeGrossAllocation(computeTaxBreakdown(0, HELSINKI_RATE_PERCENT));
    expect(segments).toHaveLength(0);
  });
});

describe("normalizeTaxToolState", () => {
  it("falls back entirely for an empty object", () => {
    expect(normalizeTaxToolState({}, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });

  it("falls back for garbage field types", () => {
    const normalized = normalizeTaxToolState(
      { grossAnnualIncome: 42, municipalityId: 7, customRatePercent: "high", raiseAmount: null },
      FALLBACK_STATE,
    );
    expect(normalized).toEqual(FALLBACK_STATE);
  });

  it("rejects an unknown municipality id", () => {
    const normalized = normalizeTaxToolState(
      { municipalityId: "atlantis" },
      FALLBACK_STATE,
    );
    expect(normalized.municipalityId).toBe(FALLBACK_STATE.municipalityId);
  });

  it("keeps the custom municipality id", () => {
    const normalized = normalizeTaxToolState(
      { municipalityId: CUSTOM_MUNICIPALITY_ID },
      FALLBACK_STATE,
    );
    expect(normalized.municipalityId).toBe(CUSTOM_MUNICIPALITY_ID);
  });

  it("clamps an out-of-range custom rate", () => {
    const tooHigh = normalizeTaxToolState({ customRatePercent: 99 }, FALLBACK_STATE);
    expect(tooHigh.customRatePercent).toBe(CUSTOM_RATE_MAX_PERCENT);
    const tooLow = normalizeTaxToolState({ customRatePercent: 1 }, FALLBACK_STATE);
    expect(tooLow.customRatePercent).toBe(CUSTOM_RATE_MIN_PERCENT);
  });

  it("survives null input", () => {
    expect(normalizeTaxToolState(null, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });
});

describe("municipalRateForState", () => {
  it("resolves a known municipality's rate", () => {
    expect(municipalRateForState(FALLBACK_STATE)).toBe(HELSINKI_RATE_PERCENT);
  });

  it("uses the custom rate when custom is selected", () => {
    expect(
      municipalRateForState({
        ...FALLBACK_STATE,
        municipalityId: CUSTOM_MUNICIPALITY_ID,
        customRatePercent: 9.4,
      }),
    ).toBe(9.4);
  });
});
