import { describe, it, expect } from "vitest";
import { computeSpending, normalizeSpending } from "@/lib/budgetSpending";
import {
  blankPlan,
  clearPaid,
  computeBudget,
  copyMonthPlan,
  normalizeState,
  REMAINDER_ID,
  type BudgetRow,
  type BudgetState,
} from "@/lib/budget";

const entry = (name: string, amount: string) => ({ id: `${name}-${amount}`, name, amount });

describe("computeSpending", () => {
  it("is null when there is no log, or the log is empty", () => {
    expect(computeSpending(undefined, 200)).toBeNull();
    expect(computeSpending([], 200)).toBeNull();
  });

  it("sums the entries and reports what is left", () => {
    const summary = computeSpending([entry("Kahvi", "4,50"), entry("Elokuvat", "24")], 200);
    expect(summary?.spent).toBeCloseTo(28.5);
    expect(summary?.left).toBeCloseTo(171.5);
    expect(summary?.fraction).toBeCloseTo(28.5 / 200);
    expect(summary?.isOver).toBe(false);
  });

  it("ignores blank and unparseable amounts", () => {
    const summary = computeSpending([entry("Kahvi", ""), entry("Muu", "abc")], 200);
    expect(summary?.spent).toBe(0);
    expect(summary?.isOver).toBe(false);
  });

  it("is not over when spending lands exactly on budget", () => {
    const summary = computeSpending([entry("A", "0,1"), entry("B", "0,2")], 0.3);
    expect(summary?.isOver).toBe(false);
    expect(summary?.fraction).toBe(1);
  });

  it("flags overspending and clamps the meter at full", () => {
    const summary = computeSpending([entry("Illallinen", "250")], 200);
    expect(summary?.isOver).toBe(true);
    expect(summary?.left).toBe(-50);
    expect(summary?.fraction).toBe(1);
  });
});

describe("normalizeSpending", () => {
  it("treats anything but a non-empty list as untracked", () => {
    expect(normalizeSpending(undefined)).toBeUndefined();
    expect(normalizeSpending("nope")).toBeUndefined();
    expect(normalizeSpending([])).toBeUndefined();
  });

  it("backfills missing fields on stored entries", () => {
    expect(normalizeSpending([{ name: "Kahvi" }, null])).toEqual([
      { id: "entry-0", name: "Kahvi", amount: "" },
      { id: "entry-1", name: "", amount: "" },
    ]);
  });
});

describe("spending on budget sections", () => {
  const tracked: BudgetRow = {
    id: "fun",
    name: "Hauska",
    amount: "200",
    spending: [entry("Kahvi", "4,50")],
  };

  it("puts a spending summary on tracked slices, never on the remainder", () => {
    const summary = computeBudget([{ id: "pay", name: "Palkka", amount: "1000" }], [tracked]);
    expect(summary.slices[0].spending?.spent).toBeCloseTo(4.5);
    expect(summary.slices.find((slice) => slice.id === REMAINDER_ID)?.spending).toBeNull();
  });

  it("leaves untracked slices without a summary", () => {
    const summary = computeBudget([], [{ id: "rent", name: "Vuokra", amount: "900" }]);
    expect(summary.slices[0].spending).toBeNull();
  });

  it("does not let the log change the budget totals", () => {
    const withLog = computeBudget([{ id: "pay", name: "Palkka", amount: "1000" }], [tracked]);
    const withoutLog = computeBudget(
      [{ id: "pay", name: "Palkka", amount: "1000" }],
      [{ id: "fun", name: "Hauska", amount: "200" }],
    );
    expect(withLog.allocated).toBe(withoutLog.allocated);
    expect(withLog.remaining).toBe(withoutLog.remaining);
  });

  it("keeps the log when the paid ticks are cleared", () => {
    const plan = { ...blankPlan("salary"), sections: [{ ...tracked, isPaid: true }] };
    const [cleared] = clearPaid(plan).sections;
    expect(cleared.isPaid).toBeUndefined();
    expect(cleared.spending).toEqual(tracked.spending);
  });

  it("starts a copied month with an empty log", () => {
    const copy = copyMonthPlan({ incomes: [], sections: [tracked] });
    expect(copy.sections[0].name).toBe("Hauska");
    expect(copy.sections[0].spending).toBeUndefined();
  });

  it("round-trips a stored log through normalizeState, dropping junk", () => {
    const fallback: BudgetState = {
      mode: "salary",
      months: {},
      salarySavings: blankPlan("salary").savings,
      trip: blankPlan("trip"),
    };
    const state = normalizeState(
      {
        months: {
          "2026-11": {
            incomes: [],
            sections: [
              { id: "fun", name: "Hauska", amount: "200", spending: [entry("Kahvi", "4,50")] },
              { id: "bad", name: "Muu", amount: "50", spending: "junk" },
            ],
          },
        },
      },
      fallback,
    );
    const [fun, bad] = state.months["2026-11"].sections;
    expect(fun.spending).toEqual([entry("Kahvi", "4,50")]);
    expect(bad.spending).toBeUndefined();
  });
});
