import { describe, it, expect } from "vitest";
import {
  computeBudget,
  computeSavings,
  computeTripSavings,
  computeStatusPill,
  computeTripHeadline,
  blankPlan,
  clearPaid,
  normalizeState,
  migrateLegacyState,
  selectPlan,
  applyPlanUpdate,
  sourceMonthFor,
  copyMonthPlan,
  carryLeftoverIntoSavings,
  REMAINDER_ID,
  type BudgetRow,
  type BudgetState,
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
    expect(pill.text).toMatch(/säästöön/i);
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
    expect(pill.text).toMatch(/matkan hinta/i);
  });
});

describe("computeTripHeadline", () => {
  it("celebrates once the goal is reached", () => {
    const trip = computeTripSavings(1600, "1600", "0", "");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBe(1600);
    expect(headline.label).toMatch(/valmis/i);
  });

  it("leads with the required monthly amount when a deadline is set", () => {
    const trip = computeTripSavings(1600, "100", "0", "5");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBeCloseTo(300);
    expect(headline.unit).toBe(" /kk");
  });

  it("falls back to the plain trip total with no pace or deadline", () => {
    const trip = computeTripSavings(1600, "0", "", "");
    const headline = computeTripHeadline(trip, 0);
    expect(headline.value).toBe(1600);
    expect(headline.label).toMatch(/matkan hinta yhteensä/i);
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
    expect(blankPlan("trip").incomes[0].name).toBe("Matkabudjetti");
    expect(blankPlan("salary").incomes[0].name).toBe("");
  });
});

describe("paid tracking", () => {
  const paidRow = (name: string, amount: string): BudgetRow => ({
    ...row(name, amount),
    isPaid: true,
  });

  it("splits allocated into paid and unpaid", () => {
    const summary = computeBudget(
      [row("Salary", "3000")],
      [paidRow("Rent", "1000"), row("Food", "400"), paidRow("Bus", "50")],
    );
    expect(summary.paid).toBe(1050);
    expect(summary.unpaid).toBe(400);
    expect(summary.paid + summary.unpaid).toBe(summary.allocated);
  });

  it("ignores paid sections with no usable amount", () => {
    const summary = computeBudget([], [paidRow("Empty", ""), row("Rent", "500")]);
    expect(summary.paid).toBe(0);
    expect(summary.unpaid).toBe(500);
  });

  it("carries isPaid onto slices, never onto the remainder", () => {
    const summary = computeBudget([row("Salary", "2000")], [paidRow("Rent", "1000")]);
    expect(summary.slices[0].isPaid).toBe(true);
    expect(summary.slices.find((slice) => slice.id === REMAINDER_ID)?.isPaid).toBe(false);
  });

  it("clearPaid removes every tick and keeps the rest", () => {
    const plan = { ...blankPlan("salary"), sections: [paidRow("Rent", "900")] };
    const cleared = clearPaid(plan);
    expect(cleared.sections[0].isPaid).toBeUndefined();
    expect(cleared.sections[0].amount).toBe("900");
  });

  it("blankPlan has no ticks", () => {
    expect(blankPlan("salary").sections.some((section) => section.isPaid)).toBe(false);
  });

  it("normalizeState keeps ticks and backfills old saves without them", () => {
    const stored = {
      mode: "salary",
      months: {
        "2026-11": {
          incomes: [],
          sections: [
            { id: "a", name: "Rent", amount: "900", isPaid: true },
            { id: "b", name: "Food", amount: "300" },
          ],
        },
      },
    };
    const state = normalizeState(stored, baseState);
    expect(state.months["2026-11"].sections[0].isPaid).toBe(true);
    expect(state.months["2026-11"].sections[1].isPaid).toBeUndefined();
  });
});

const baseState: BudgetState = {
  mode: "salary",
  months: {},
  salarySavings: blankPlan("salary").savings,
  trip: blankPlan("trip"),
};

describe("months", () => {
  const monthPlan = (name: string) => ({
    incomes: [row("Salary", "2000")],
    sections: [{ ...row(name, "500"), isPaid: true }],
  });

  it("migrates a v1 save into the given month with shared savings", () => {
    const savings = { ...blankPlan("salary").savings, enabled: true, balance: "100" };
    const legacy = {
      mode: "salary",
      salary: { ...monthPlan("Rent"), savings },
      trip: blankPlan("trip"),
    };
    const state = migrateLegacyState(
      legacy,
      { salary: blankPlan("salary"), trip: blankPlan("trip") },
      "2026-11",
    );
    expect(Object.keys(state.months)).toEqual(["2026-11"]);
    expect(state.months["2026-11"].sections[0].name).toBe("Rent");
    expect(state.salarySavings.balance).toBe("100");
  });

  it("drops stored months with invalid keys", () => {
    const state = normalizeState(
      { months: { "2026-11": monthPlan("A"), nonsense: monthPlan("B") } },
      baseState,
    );
    expect(Object.keys(state.months)).toEqual(["2026-11"]);
  });

  it("selectPlan is null for an unstarted month and joins shared savings otherwise", () => {
    const state = { ...baseState, months: { "2026-11": monthPlan("Rent") } };
    expect(selectPlan(state, "2026-12")).toBeNull();
    expect(selectPlan(state, "2026-11")?.savings).toBe(state.salarySavings);
  });

  it("applyPlanUpdate edits one month and shares savings across months", () => {
    const state = {
      ...baseState,
      months: { "2026-10": monthPlan("Old"), "2026-11": monthPlan("Rent") },
    };
    const next = applyPlanUpdate(state, "2026-11", (plan) => ({
      ...plan,
      sections: [],
      savings: { ...plan.savings, balance: "999" },
    }));
    expect(next.months["2026-11"].sections).toEqual([]);
    expect(next.months["2026-10"].sections[0].name).toBe("Old");
    expect(selectPlan(next, "2026-10")?.savings.balance).toBe("999");
  });

  it("applyPlanUpdate leaves an unstarted month alone", () => {
    expect(applyPlanUpdate(baseState, "2026-11", (plan) => plan)).toBe(baseState);
  });

  it("sourceMonthFor prefers the latest earlier month, else the earliest later", () => {
    expect(sourceMonthFor(["2026-08", "2026-10", "2027-01"], "2026-11")).toBe("2026-10");
    expect(sourceMonthFor(["2027-01", "2026-12"], "2026-11")).toBe("2026-12");
    expect(sourceMonthFor(["2026-11"], "2026-11")).toBeNull();
  });

  it("copyMonthPlan keeps lines, gives fresh ids and clears paid ticks", () => {
    const original = monthPlan("Rent");
    const copy = copyMonthPlan(original);
    expect(copy.sections[0].name).toBe("Rent");
    expect(copy.sections[0].amount).toBe("500");
    expect(copy.sections[0].isPaid).toBeUndefined();
    expect(copy.sections[0].id).not.toBe(original.sections[0].id);
  });

  it("carryLeftoverIntoSavings adds the leftover to the balance", () => {
    const savings = { ...blankPlan("salary").savings, enabled: true, balance: "100.50" };
    const month = { incomes: [row("Salary", "2000")], sections: [row("Rent", "1500")] };
    expect(carryLeftoverIntoSavings(savings, month).balance).toBe("600.5");
  });

  it("carryLeftoverIntoSavings ignores overspend and disabled savings", () => {
    const enabled = { ...blankPlan("salary").savings, enabled: true, balance: "100" };
    const over = { incomes: [row("Salary", "1000")], sections: [row("Rent", "1500")] };
    expect(carryLeftoverIntoSavings(enabled, over)).toBe(enabled);
    const disabled = { ...enabled, enabled: false };
    const under = { incomes: [row("Salary", "2000")], sections: [] };
    expect(carryLeftoverIntoSavings(disabled, under)).toBe(disabled);
  });
});
