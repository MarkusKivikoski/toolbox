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

/** Optional savings goal. The monthly contribution is the unallocated leftover. */
export type SavingsState = {
  enabled: boolean;
  /** Current balance you've already saved. */
  balance: string;
  /** The amount you're saving toward. */
  target: string;
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
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : false,
    balance: typeof o.balance === "string" ? o.balance : "",
    target: typeof o.target === "string" ? o.target : "",
  };
}

export type BudgetState = {
  incomes: BudgetRow[];
  sections: BudgetRow[];
  savings: SavingsState;
};

export function normalizeState(s: unknown, fallback: BudgetState): BudgetState {
  // v1 stored a single `income` string; carry it into one income row.
  const o = (s ?? {}) as Partial<BudgetState> & { income?: unknown };
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
    savings: normalizeSavings(o.savings),
  };
}
