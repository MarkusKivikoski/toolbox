// Pure investment-projection engine. No React, no DOM — easy to test and reuse.
//
// Timeline is driven by age:
//   - Saving runs from `currentAge` to `retirementAge`.
//   - Drawdown runs from `retirementAge` to `lifeExpectancy`.

export type ContributionPhase = {
  id: string;
  /** Whole years this phase lasts. Ignored for the *last* phase, which always
   *  runs until retirement age. */
  years: number;
  /** Amount invested every month during this phase. */
  monthlyContribution: number;
};

export type WithdrawalMode = "fixed" | "spendDown";

export type RetirementSettings = {
  enabled: boolean;
  /** "fixed" = withdraw a set amount; "spendDown" = take out as much as
   *  possible so the balance hits ≈0 at life expectancy. */
  mode: WithdrawalMode;
  /** Amount withdrawn every month to live on (used in "fixed" mode). */
  monthlyWithdrawal: number;
  /** Expected yearly return while retired (often lower / more conservative). */
  annualReturnPct: number;
};

export type InvestingInput = {
  startingBalance: number;
  /** Expected yearly return during the saving phase, in percent. */
  annualReturnPct: number;
  currentAge: number;
  /** Age contributions stop and (if enabled) withdrawals begin. */
  retirementAge: number;
  /** Age the plan ends — sets how long the drawdown must last. */
  lifeExpectancy: number;
  phases: ContributionPhase[];
  retirement: RetirementSettings;
  /** Yearly inflation, in percent. 0 disables the "today's money" column. */
  inflationPct: number;
};

export type Stage = "accumulation" | "retirement";

export type YearPoint = {
  /** Whole years from today (0 = now). */
  year: number;
  /** Age at this point (currentAge + year). */
  age: number;
  stage: Stage;
  /** Nominal balance at the end of this year. */
  balance: number;
  /** Starting balance + every contribution made so far (never decreases). */
  contributed: number;
  /** Balance expressed in today's money (nominal / inflation factor). */
  realBalance: number;
};

export type InvestingResult = {
  points: YearPoint[];
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  accumulationYears: number;
  retirementYears: number;
  totalYears: number;
  startingBalance: number;
  /** Balance the moment saving stops / retirement starts. */
  endOfAccumulationBalance: number;
  /** Balance at the very end of the projection. */
  finalBalance: number;
  /** Sum of all monthly contributions (excludes the starting balance). */
  totalContributions: number;
  /** Investment gains earned during the saving phase. */
  accumulationGrowth: number;
  /** Sum of everything withdrawn during retirement. */
  totalWithdrawn: number;
  /** Which withdrawal strategy was applied. */
  withdrawalMode: WithdrawalMode;
  /** Monthly withdrawal in the first retirement year (the figure to show). */
  firstMonthlyWithdrawal: number;
  /** Monthly withdrawal in the final retirement year (after inflation step-ups). */
  lastMonthlyWithdrawal: number;
  /** Fractional year (from today) the money runs out, or null if it lasts. */
  depletionYear: number | null;
  /** Age the money runs out, or null if it lasts. */
  depletionAge: number | null;
  /** Final balance expressed in today's money. */
  realFinalBalance: number;
};

const num = (v: number): number => (Number.isFinite(v) ? v : 0);

const numOr = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

/** Convert a yearly percentage into the equivalent monthly growth factor. */
function monthlyRate(annualReturnPct: number): number {
  return Math.pow(1 + num(annualReturnPct) / 100, 1 / 12) - 1;
}

/**
 * First-year monthly withdrawal that drains `balance` to exactly 0 over `months`,
 * where withdrawals step up once per year by `annualInflation` (so real spending
 * stays flat). Returns the first-year amount W0; later years are W0·(1+g)^year.
 *
 * Because the balance is linear in W0, this is the closed-form solution to
 * `balance·(1+r)^n − W0·Σ (1+g)^floor(m/12)·(1+r)^(n-1-m) = 0`.
 */
export function solveSpendDownWithdrawal(
  balance: number,
  monthlyReturn: number,
  months: number,
  annualInflation: number
): number {
  if (months <= 0 || balance <= 0) return 0;
  let denom = 0;
  for (let m = 0; m < months; m++) {
    const step = Math.pow(1 + annualInflation, Math.floor(m / 12));
    denom += step * Math.pow(1 + monthlyReturn, months - 1 - m);
  }
  if (denom <= 0) return 0;
  return (balance * Math.pow(1 + monthlyReturn, months)) / denom;
}

/** Fill in any missing/invalid fields — used when loading saved or older data. */
export function normalizeInput(p: Partial<InvestingInput> | null | undefined): InvestingInput {
  const src = p ?? {};
  const phases = Array.isArray(src.phases) && src.phases.length > 0
    ? src.phases
    : [{ id: "phase-1", years: 10, monthlyContribution: 100 }];
  return {
    startingBalance: numOr(src.startingBalance, 0),
    annualReturnPct: numOr(src.annualReturnPct, 7),
    currentAge: numOr(src.currentAge, 30),
    retirementAge: numOr(src.retirementAge, 65),
    lifeExpectancy: numOr(src.lifeExpectancy, 90),
    phases: phases.map((ph, i) => ({
      id: typeof ph?.id === "string" ? ph.id : `phase-${i + 1}`,
      years: numOr(ph?.years, 5),
      monthlyContribution: numOr(ph?.monthlyContribution, 0),
    })),
    retirement: {
      enabled: Boolean(src.retirement?.enabled),
      mode: src.retirement?.mode === "spendDown" ? "spendDown" : "fixed",
      monthlyWithdrawal: numOr(src.retirement?.monthlyWithdrawal, 1500),
      annualReturnPct: numOr(src.retirement?.annualReturnPct, 4),
    },
    inflationPct: numOr(src.inflationPct, 0),
  };
}

/**
 * Runs a month-by-month simulation.
 *
 * Conventions:
 *  - Returns compound monthly so "7%/yr" yields exactly 7% over a full year.
 *  - Contributions are added at the end of each month (ordinary annuity).
 *  - Withdrawals are taken at the end of each month, after that month's growth.
 *  - The final contribution phase continues until retirement age; earlier phases
 *    last their stated number of years.
 */
export function calculateProjection(input: InvestingInput): InvestingResult {
  const startingBalance = Math.max(0, num(input.startingBalance));
  const accRate = monthlyRate(input.annualReturnPct);
  const inflation = num(input.inflationPct) / 100;

  const currentAge = num(input.currentAge);
  const retirementAge = num(input.retirementAge);
  const lifeExpectancy = num(input.lifeExpectancy);

  const accumulationYears = Math.max(0, Math.floor(retirementAge - currentAge));
  const retirementYears = input.retirement.enabled
    ? Math.max(0, Math.floor(lifeExpectancy - retirementAge))
    : 0;

  const realFactor = (year: number) =>
    inflation > 0 ? Math.pow(1 + inflation, year) : 1;

  // Monthly contribution for accumulation month `i` (0-based). Earlier phases
  // cover their stated years; the last phase fills the rest up to retirement.
  const phases = input.phases;
  const amountForMonth = (i: number): number => {
    if (phases.length === 0) return 0;
    let cumMonths = 0;
    for (let p = 0; p < phases.length - 1; p++) {
      cumMonths += Math.max(0, Math.floor(num(phases[p].years))) * 12;
      if (i < cumMonths) return num(phases[p].monthlyContribution);
    }
    return num(phases[phases.length - 1].monthlyContribution);
  };

  let balance = startingBalance;
  let contributed = startingBalance;
  let totalContributions = 0;

  const points: YearPoint[] = [
    {
      year: 0,
      age: currentAge,
      stage: "accumulation",
      balance,
      contributed,
      realBalance: balance,
    },
  ];

  // ---- Accumulation phase ----
  const accMonths = accumulationYears * 12;
  for (let i = 0; i < accMonths; i++) {
    const c = amountForMonth(i);
    balance = balance * (1 + accRate) + c;
    contributed += c;
    totalContributions += c;
    if ((i + 1) % 12 === 0) {
      const year = (i + 1) / 12;
      points.push({
        year,
        age: currentAge + year,
        stage: "accumulation",
        balance,
        contributed,
        realBalance: balance / realFactor(year),
      });
    }
  }

  const endOfAccumulationBalance = balance;
  const accumulationGrowth =
    endOfAccumulationBalance - startingBalance - totalContributions;

  // ---- Retirement phase ----
  const retRate = monthlyRate(input.retirement.annualReturnPct);
  const retMonths = retirementYears * 12;
  const spendDown = input.retirement.mode === "spendDown";
  // In spend-down mode the first-year amount is solved so the pot ends at ≈0;
  // each later year steps up with inflation. In fixed mode it's the entered amount.
  const baseWithdrawal = spendDown
    ? solveSpendDownWithdrawal(endOfAccumulationBalance, retRate, retMonths, inflation)
    : Math.max(0, num(input.retirement.monthlyWithdrawal));

  let totalWithdrawn = 0;
  let depletionMonth: number | null = null;

  for (let j = 0; j < retMonths; j++) {
    const w = spendDown
      ? baseWithdrawal * Math.pow(1 + inflation, Math.floor(j / 12))
      : baseWithdrawal;
    const grown = balance * (1 + retRate);
    if (grown <= w) {
      // Last of the money: only what's left can be taken out.
      totalWithdrawn += grown;
      balance = 0;
      if (depletionMonth === null) depletionMonth = accMonths + j + 1;
    } else {
      balance = grown - w;
      totalWithdrawn += w;
    }
    if ((j + 1) % 12 === 0) {
      const year = accumulationYears + (j + 1) / 12;
      points.push({
        year,
        age: currentAge + year,
        stage: "retirement",
        balance,
        contributed,
        realBalance: balance / realFactor(year),
      });
    }
  }

  const totalYears = accumulationYears + retirementYears;
  const depletionYear = depletionMonth === null ? null : depletionMonth / 12;
  const lastMonthlyWithdrawal =
    retirementYears > 0
      ? baseWithdrawal * Math.pow(1 + inflation, retirementYears - 1)
      : baseWithdrawal;

  return {
    points,
    currentAge,
    retirementAge,
    lifeExpectancy,
    accumulationYears,
    retirementYears,
    totalYears,
    startingBalance,
    endOfAccumulationBalance,
    finalBalance: balance,
    totalContributions,
    accumulationGrowth,
    totalWithdrawn,
    withdrawalMode: input.retirement.mode,
    firstMonthlyWithdrawal: baseWithdrawal,
    lastMonthlyWithdrawal,
    depletionYear,
    depletionAge: depletionYear === null ? null : currentAge + depletionYear,
    realFinalBalance: balance / realFactor(totalYears),
  };
}
