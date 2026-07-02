import { describe, it, expect } from "vitest";
import {
  computeBudget,
  computeSavings,
  computeTripSavings,
  computeStatusPill,
  computeTripHeadline,
  blankPlan,
  REMAINDER_ID,
  type BudgetRow,
} from "@/lib/budget";

const row = (name: string, amount: string): BudgetRow => ({
  id: `${name}-${amount}`,
  name,
  amount,
});

describe("computeBudget", () => {
  it("returns zeroed summary with no income and no sections", () => {
    const summary = computeBudget([], []);
    expect(summary.income).toBe(0);
    expect(summary.allocated).toBe(0);
    expect(summary.remaining).toBe(0);
    expect(summary.overBudget).toBe(false);
    expect(summary.slices).toEqual([]);
  });

  it("appends a remainder slice when income exceeds allocation", () => {
    const summary = computeBudget(
      [row("Salary", "2000")],
      [row("Rent", "1200")],
      "Left to budget",
    );
    expect(summary.remaining).toBe(800);
    const remainder = summary.slices.find((slice) => slice.id === REMAINDER_ID);
    expect(remainder).toBeDefined();
    expect(remainder?.amount).toBe(800);
    expect(remainder?.isRemainder).toBe(true);
  });

  it("flags over budget and adds no remainder", () => {
    const summary = computeBudget(
      [row("Salary", "1000")],
      [row("Rent", "1200")],
    );
    expect(summary.overBudget).toBe(true);
    expect(summary.remaining).toBe(-200);
    expect(summary.slices.some((slice) => slice.id === REMAINDER_ID)).toBe(false);
  });

  it("drops zero-amount sections from the chart", () => {
    const summary = computeBudget(
      [row("Salary", "1000")],
      [row("Rent", "500"), row("Empty", "")],
    );
    expect(summary.slices).toHaveLength(2); // Rent + remainder, no Empty
    expect(summary.slices.some((slice) => slice.name === "Empty")).toBe(false);
  });
});

describe("computeSavings", () => {
  it("has no ETA when there's nothing left to save", () => {
    const projection = computeSavings(0, "1000", "5000");
    expect(projection.monthly).toBe(0);
    expect(projection.monthsToTarget).toBeNull();
    expect(projection.reached).toBe(false);
  });

  it("marks the goal reached once the balance meets the target", () => {
    const projection = computeSavings(300, "5000", "5000");
    expect(projection.reached).toBe(true);
    expect(projection.progress).toBe(1);
    expect(projection.monthsToTarget).toBeNull();
  });

  it("rounds the months-to-target up", () => {
    const projection = computeSavings(300, "0", "1000");
    expect(projection.monthsToTarget).toBe(4); // ceil(1000 / 300)
  });
});

describe("computeTripSavings", () => {
  it("has no plan when neither pace nor deadline is set", () => {
    const trip = computeTripSavings(1600, "0", "", "");
    expect(trip.monthsToAfford).toBeNull();
    expect(trip.requiredPerMonth).toBeNull();
    expect(trip.onTrack).toBe(false);
  });

  it("derives the required monthly amount from a deadline", () => {
    const trip = computeTripSavings(1600, "100", "0", "5");
    expect(trip.requiredPerMonth).toBeCloseTo(300); // (1600 - 100) / 5
    expect(trip.onTrack).toBe(false);
  });

  it("is on track when the pace covers the deadline requirement", () => {
    const trip = computeTripSavings(1600, "100", "400", "5");
    expect(trip.onTrack).toBe(true);
  });

  it("reports reached once saved enough", () => {
    const trip = computeTripSavings(1600, "1600", "0", "");
    expect(trip.reached).toBe(true);
    expect(trip.progress).toBe(1);
  });
});

describe("computeStatusPill", () => {
  it("prompts for income in salary mode when none is entered", () => {
    const pill = computeStatusPill({
      mode: "salary",
      allocated: 500,
      income: 0,
      overBudget: false,
      remaining: -500,
      savingsEnabled: false,
    });
    expect(pill.tone).toBe("zinc");
  });

  it("goes amber when over budget", () => {
    const pill = computeStatusPill({
      mode: "salary",
      allocated: 1200,
      income: 1000,
      overBudget: true,
      remaining: -200,
      savingsEnabled: false,
    });
    expect(pill.tone).toBe("amber");
  });

  it("mentions savings when enabled and money is left over", () => {
    const pill = computeStatusPill({
      mode: "salary",
      allocated: 800,
      income: 1000,
      overBudget: false,
      remaining: 200,
      savingsEnabled: true,
    });
    expect(pill.tone).toBe("emerald");
    expect(pill.text).toMatch(/savings/i);
  });

  it("shows the total trip cost when no trip budget is set", () => {
    const pill = computeStatusPill({
      mode: "trip",
      allocated: 1600,
      income: 0,
      overBudget: false,
      remaining: -1600,
      savingsEnabled: false,
    });
    expect(pill.tone).toBe("zinc");
    expect(pill.text).toMatch(/trip cost/i);
  });
});

describe("computeTripHeadline", () => {
  it("celebrates once the goal is reached", () => {
    const trip = computeTripSavings(1600, "1600", "0", "");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBe(1600);
    expect(headline.label).toMatch(/all set/i);
  });

  it("leads with the required monthly amount when a deadline is set", () => {
    const trip = computeTripSavings(1600, "100", "0", "5");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBeCloseTo(300);
    expect(headline.unit).toBe(" /mo");
  });

  it("falls back to the plain trip total with no pace or deadline", () => {
    const trip = computeTripSavings(1600, "0", "", "");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBe(1600);
    expect(headline.label).toMatch(/total trip cost/i);
  });
});

describe("blankPlan", () => {
  it("makes a single empty section and unique row ids", () => {
    const plan = blankPlan("salary");
    expect(plan.sections).toHaveLength(1);
    expect(plan.savings.enabled).toBe(false);
    expect(plan.incomes[0].id).not.toBe(plan.sections[0].id);
  });

  it("seeds the trip budget row name in trip mode", () => {
    expect(blankPlan("trip").incomes[0].name).toBe("Trip budget");
    expect(blankPlan("salary").incomes[0].name).toBe("");
  });
});
