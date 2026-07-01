// Budget breakdown engine — no React, fully unit-testable.
//
// You enter any number of income sources and spending sections; this turns the
// sections into doughnut slices (each section, plus a "left to budget"
// remainder) with the fractions and colours the chart needs.

/** One editable line — used for both income sources and spending sections. */
export type BudgetRow = {
  id: string;
  /** Free-typed label, e.g. "Rent" or "Salary". */
  name: string;
  /** Free-typed euro amount, kept as a string so partial input survives. */
  amount: string;
};

export type BudgetSlice = {
  id: string;
  name: string;
  amount: number;
  /** Share of the doughnut total, 0–1. */
  fraction: number;
  /** Hex fill for section slices; `null` for the themed remainder slice. */
  color: string | null;
  isRemainder: boolean;
};

export type BudgetSummary = {
  income: number;
  /** Sum of all section amounts. */
  allocated: number;
  /** income − allocated (negative when over budget). */
  remaining: number;
  /** What the doughnut sums to: max(income, allocated). */
  total: number;
  overBudget: boolean;
  slices: BudgetSlice[];
};

/** Distinct, dark-mode-friendly slice colours, cycled by section order. */
export const SECTION_COLORS = [
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#f97316", // orange
  "#84cc16", // lime
  "#d946ef", // fuchsia
  "#06b6d4", // cyan
  "#ec4899", // pink
] as const;

export const REMAINDER_ID = "__remainder__";

/** The colour a section at a given position is drawn with. */
export function colorForIndex(index: number): string {
  return SECTION_COLORS[index % SECTION_COLORS.length];
}

/** Parse a free-typed euro figure, tolerating spaces and a comma decimal. */
export function parseAmount(s: string): number {
  const cleaned = s
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Fold income sources + sections into the doughnut model. Sections with a zero
 * (or unparseable) amount are kept in the form by the caller but left out of
 * the chart here. When income exceeds what's allocated, the leftover becomes a
 * muted "left to budget" remainder slice.
 */
export function computeBudget(
  incomes: BudgetRow[],
  sections: BudgetRow[],
  remainderLabel = "Left to budget",
): BudgetSummary {
  const income = incomes.reduce((sum, i) => sum + parseAmount(i.amount), 0);

  const valued = sections
    .map((s, i) => ({
      id: s.id,
      name: s.name.trim() || "Untitled",
      amount: parseAmount(s.amount),
      color: colorForIndex(i),
    }))
    .filter((s) => s.amount > 0);

  const allocated = valued.reduce((sum, s) => sum + s.amount, 0);
  const remaining = income - allocated;
  const total = Math.max(income, allocated);
  const overBudget = remaining < -0.005;

  const slices: BudgetSlice[] = valued.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    fraction: total > 0 ? s.amount / total : 0,
    color: s.color,
    isRemainder: false,
  }));

  if (remaining > 0.005) {
    slices.push({
      id: REMAINDER_ID,
      name: remainderLabel,
      amount: remaining,
      fraction: total > 0 ? remaining / total : 0,
      color: null,
      isRemainder: true,
    });
  }

  return { income, allocated, remaining, total, overBudget, slices };
}

/**
 * Optional savings goal. In salary mode the monthly contribution is the
 * unallocated leftover and `target` is a goal you set; in trip mode you enter
 * `perMonth` explicitly (and optionally `monthsUntilTrip`), saving toward the
 * trip's total cost.
 */
export type SavingsState = {
  enabled: boolean;
  /** Current balance you've already saved (both modes). */
  balance: string;
  /** Salary mode: the amount you're saving toward. */
  target: string;
  /** Trip mode: explicit amount saved each month. */
  perMonth: string;
  /** Trip mode: optional deadline, in whole months from now. */
  monthsUntilTrip: string;
};

export type SavingsProjection = {
  /** Monthly contribution — the unallocated money, clamped at zero. */
  monthly: number;
  balance: number;
  target: number;
  /** balance / target, clamped to 0–1. */
  progress: number;
  reached: boolean;
  /** Whole months to reach the target at this rate; null if unreachable. */
  monthsToTarget: number | null;
};

/**
 * Project a savings goal from the monthly leftover. With no money left over (or
 * no target set) the target is unreachable, so `monthsToTarget` is null.
 */
export function computeSavings(
  monthlyLeftover: number,
  balanceStr: string,
  targetStr: string,
): SavingsProjection {
  const balance = parseAmount(balanceStr);
  const target = parseAmount(targetStr);
  const monthly = monthlyLeftover > 0 ? monthlyLeftover : 0;
  const reached = target > 0 && balance >= target;
  const toGo = Math.max(0, target - balance);
  const monthsToTarget =
    !reached && monthly > 0 && target > 0 ? Math.ceil(toGo / monthly) : null;
  const progress = target > 0 ? Math.min(1, balance / target) : 0;
  return { monthly, balance, target, progress, reached, monthsToTarget };
}

export type TripSavings = {
  balance: number;
  /** The trip total to save toward. */
  target: number;
  /** balance / target, clamped to 0–1. */
  progress: number;
  reached: boolean;
  /** Months to afford it at your own pace; null when the pace is zero. */
  monthsToAfford: number | null;
  /** €/month needed to make the deadline; null when no deadline is set. */
  requiredPerMonth: number | null;
  /** Whether your pace covers the required amount (only meaningful with a deadline). */
  onTrack: boolean;
};

/**
 * Project saving up for a one-off trip: how long until you can afford it at your
 * chosen monthly rate, and — if you set a deadline — how much you'd need to put
 * aside each month to get there on top of your current savings.
 */
export function computeTripSavings(
  tripTotal: number,
  balanceStr: string,
  perMonthStr: string,
  monthsUntilTripStr: string,
): TripSavings {
  const balance = parseAmount(balanceStr);
  const perMonth = parseAmount(perMonthStr);
  const monthsUntil = Math.max(0, Math.floor(parseAmount(monthsUntilTripStr)));
  const target = tripTotal;
  const reached = target > 0 && balance >= target;
  const toGo = Math.max(0, target - balance);
  const monthsToAfford =
    !reached && perMonth > 0 && target > 0 ? Math.ceil(toGo / perMonth) : null;
  const requiredPerMonth =
    !reached && monthsUntil > 0 && target > 0 ? toGo / monthsUntil : null;
  const onTrack = requiredPerMonth !== null && perMonth >= requiredPerMonth;
  const progress = target > 0 ? Math.min(1, balance / target) : 0;
  return {
    balance,
    target,
    progress,
    reached,
    monthsToAfford,
    requiredPerMonth,
    onTrack,
  };
}

/** Backfill a stored row so older saves don't crash on load. */
function normalizeRow(s: unknown, i: number): BudgetRow {
  const o = (s ?? {}) as Partial<BudgetRow>;
  return {
    id: typeof o.id === "string" ? o.id : `row-${i}-${Date.now()}`,
    name: typeof o.name === "string" ? o.name : "",
    amount: typeof o.amount === "string" ? o.amount : "",
  };
}

/** Backfill savings; defaults to off so existing saves aren't surprised. */
function normalizeSavings(s: unknown): SavingsState {
  const o = (s ?? {}) as Partial<SavingsState>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : false,
    balance: str(o.balance),
    target: str(o.target),
    perMonth: str(o.perMonth),
    monthsUntilTrip: str(o.monthsUntilTrip),
  };
}

export type Mode = "salary" | "trip";

/** One mode's dataset. In trip mode `incomes` holds a single "budget" row. */
export type PlanData = {
  incomes: BudgetRow[];
  sections: BudgetRow[];
  savings: SavingsState;
};

export type BudgetState = {
  mode: Mode;
  salary: PlanData;
  trip: PlanData;
};

function normalizePlan(s: unknown, fallback: PlanData): PlanData {
  // v1 stored a single `income` string; carry it into one income row.
  const o = (s ?? {}) as Partial<PlanData> & { income?: unknown };
  const incomes = Array.isArray(o.incomes)
    ? o.incomes.map(normalizeRow)
    : typeof o.income === "string"
      ? [{ id: `income-0-${Date.now()}`, name: "Income", amount: o.income }]
      : fallback.incomes;
  return {
    incomes,
    sections: Array.isArray(o.sections)
      ? o.sections.map(normalizeRow)
      : fallback.sections,
    // Preserve a stored savings block; otherwise inherit the fallback's (so a
    // freshly-migrated trip plan keeps its enabled demo rather than going blank).
    savings: o.savings != null ? normalizeSavings(o.savings) : fallback.savings,
  };
}

export function normalizeState(s: unknown, fallback: BudgetState): BudgetState {
  const o = (s ?? {}) as Partial<BudgetState> & {
    // pre-mode saves stored the salary plan's fields at the top level.
    incomes?: unknown;
    sections?: unknown;
    savings?: unknown;
    income?: unknown;
  };
  const hasFlatPlan =
    Array.isArray(o.incomes) ||
    Array.isArray(o.sections) ||
    typeof o.income === "string";
  const trip = normalizePlan(o.trip, fallback.trip);
  // Trip mode renders a single budget field, so it always needs one income row.
  if (trip.incomes.length === 0) {
    trip.incomes = [{ id: `trip-budget-${Date.now()}`, name: "Trip budget", amount: "" }];
  }
  return {
    mode: o.mode === "trip" ? "trip" : "salary",
    salary: normalizePlan(o.salary ?? (hasFlatPlan ? o : undefined), fallback.salary),
    trip,
  };
}
