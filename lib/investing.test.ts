import { describe, expect, it } from "vitest";
import {
  calculateProjection,
  normalizeInput,
  DEFAULT_INPUT,
  EMPTY_INPUT,
  type InvestingInput,
} from "@/lib/investing";

const withRetirement = (
  patch: Partial<InvestingInput["retirement"]>,
): InvestingInput => ({
  ...DEFAULT_INPUT,
  retirement: { ...DEFAULT_INPUT.retirement, ...patch },
});

describe("calculateProjection — accumulation", () => {
  const result = calculateProjection(DEFAULT_INPUT);

  it("derives the saving horizon from ages", () => {
    expect(result.accumulationYears).toBe(30); // 60 − 30
    expect(result.points).toHaveLength(61); // year 0 + 30 saving + 30 retired
    expect(result.points[0].age).toBe(30);
  });

  it("sums contributions exactly (1×100 + 4×250 + 25×400, monthly)", () => {
    expect(result.totalContributions).toBe(133200);
  });

  it("reports growth as balance minus everything paid in", () => {
    expect(result.accumulationGrowth).toBeCloseTo(
      result.endOfAccumulationBalance -
        result.startingBalance -
        result.totalContributions,
      6,
    );
    expect(result.endOfAccumulationBalance).toBeGreaterThan(
      result.startingBalance + result.totalContributions,
    );
  });

  it("fills the last phase up to retirement (1+4 explicit → 25 left)", () => {
    expect(result.lastPhaseYears).toBe(25);
    expect(result.phasesOverflow).toBe(false);
  });

  it("flags overflow when earlier phases outrun the retirement age", () => {
    const overrun = calculateProjection({
      ...DEFAULT_INPUT,
      phases: [
        { id: "a", years: 40, monthlyContribution: 100 },
        { id: "b", years: 5, monthlyContribution: 200 },
      ],
    });
    expect(overrun.phasesOverflow).toBe(true);
    expect(overrun.lastPhaseYears).toBe(0);
  });
});

describe("calculateProjection — withdrawal modes", () => {
  it("net mode delivers the entered net amount", () => {
    const result = calculateProjection(
      withRetirement({ mode: "fixed", basis: "net", monthlyWithdrawal: 2500 }),
    );
    expect(result.firstMonthlyNet).toBeCloseTo(2500, 2);
  });

  it("gross mode sells the entered gross amount", () => {
    const result = calculateProjection(
      withRetirement({ mode: "fixed", basis: "gross", monthlyWithdrawal: 2500 }),
    );
    expect(result.firstMonthlyGross).toBeCloseTo(2500, 2);
  });

  it("spend-it-all drains the pot to ≈0 at life expectancy", () => {
    const result = calculateProjection(withRetirement({ mode: "spendDown" }));
    expect(Math.abs(result.finalBalance)).toBeLessThan(1);
    expect(result.firstMonthlyNet).toBeGreaterThan(0);
  });

  it("a too-large fixed withdrawal runs out early", () => {
    const result = calculateProjection(
      withRetirement({ mode: "fixed", basis: "net", monthlyWithdrawal: 12000 }),
    );
    expect(result.depletionAge).not.toBeNull();
    expect(result.depletionIntoRetirement).toBeGreaterThan(0);
    expect(result.depletionAge!).toBeLessThan(DEFAULT_INPUT.lifeExpectancy);
  });
});

describe("calculateProjection — tax", () => {
  it("hankintameno-olettama never taxes more than the actual gain", () => {
    const withPresumption = calculateProjection(
      withRetirement({ mode: "fixed", monthlyWithdrawal: 3000, usePresumedCost: true }),
    );
    const withoutPresumption = calculateProjection(
      withRetirement({ mode: "fixed", monthlyWithdrawal: 3000, usePresumedCost: false }),
    );
    // For a long-grown portfolio the gain share exceeds 60%, so the cap helps.
    expect(withPresumption.totalTax).toBeLessThan(withoutPresumption.totalTax);
  });

  it("zero tax leaves net equal to gross", () => {
    const result = calculateProjection(
      withRetirement({ mode: "spendDown", capitalGainsTaxPct: 0 }),
    );
    expect(result.firstMonthlyNet).toBeCloseTo(result.firstMonthlyGross, 2);
    expect(result.totalTax).toBeCloseTo(0, 6);
  });
});

describe("calculateProjection — kansaneläke", () => {
  it("is purely additive: depletion is unchanged by the pension", () => {
    const base = withRetirement({ mode: "fixed", basis: "net", monthlyWithdrawal: 4000 });
    const withPension = calculateProjection({
      ...base,
      retirement: { ...base.retirement, kansanelake: 800, kansanelakeStartAge: 65 },
    });
    const withoutPension = calculateProjection(base);
    expect(withPension.depletionAge).toBe(withoutPension.depletionAge);
    expect(withPension.finalBalance).toBeCloseTo(withoutPension.finalBalance, 6);
  });

  it("nets the pension by its own tax and offsets its start age", () => {
    const result = calculateProjection({
      ...DEFAULT_INPUT,
      retirement: {
        ...DEFAULT_INPUT.retirement,
        kansanelake: 800,
        kansanelakeTaxPct: 10,
        kansanelakeStartAge: 65, // 5 years after retiring at 60
      },
    });
    expect(result.pensionNetMonthly).toBeCloseTo(720, 6); // 800 × (1 − 0.10)
    // Not active at retirement start, so the headline total excludes it there…
    expect(result.firstMonthlyTotalNet).toBeCloseTo(result.firstMonthlyNet, 6);
    // …but the combined box adds it once it kicks in.
    expect(result.monthlyTotalIncomeWithPension).toBeGreaterThan(
      result.firstMonthlyNet,
    );
  });
});

describe("normalizeInput", () => {
  it("returns the empty defaults for null / empty input", () => {
    expect(normalizeInput(null)).toEqual(EMPTY_INPUT);
    expect(normalizeInput({})).toEqual(EMPTY_INPUT);
  });

  it("migrates a legacy v1 draft (no ages, no pension, partial retirement)", () => {
    const legacy = {
      startingBalance: 5000,
      phases: [{ id: "old", years: 10, monthlyContribution: 200 }],
      retirement: { enabled: true, monthlyWithdrawal: 3000, annualReturnPct: 5 },
      inflationPct: 2,
    };
    const normalized = normalizeInput(legacy);

    // Preserved fields survive.
    expect(normalized.startingBalance).toBe(5000);
    expect(normalized.inflationPct).toBe(2);
    expect(normalized.retirement.enabled).toBe(true);
    expect(normalized.retirement.monthlyWithdrawal).toBe(3000);

    // Missing fields are backfilled from EMPTY_INPUT — no crash, no NaN.
    expect(normalized.currentAge).toBe(EMPTY_INPUT.currentAge);
    expect(normalized.retirementAge).toBe(EMPTY_INPUT.retirementAge);
    expect(normalized.lifeExpectancy).toBe(EMPTY_INPUT.lifeExpectancy);
    expect(normalized.retirement.mode).toBe("fixed");
    expect(normalized.retirement.basis).toBe("net");
    expect(normalized.retirement.capitalGainsTaxPct).toBe(30);
    expect(normalized.retirement.kansanelakeStartAge).toBe(65);

    // And it's a valid input the engine can run without throwing.
    expect(() => calculateProjection(normalized)).not.toThrow();
  });
});
