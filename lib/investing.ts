// Pure investment-projection engine. No React, no DOM — easy to test and reuse.
//
// Timeline is driven by age:
//   - Saving runs from `currentAge` to `retirementAge`.
//   - Drawdown runs from `retirementAge` to `lifeExpectancy`.
//
// Retirement withdrawals are taxed: selling realises a proportional share of the
// portfolio's embedded gain (average cost basis), and that gain is taxed at the
// capital-gains rate. Optionally Finland's "hankintameno-olettama" caps the
// taxable gain at 60% of the sale (assuming holdings of 10+ years).

export type ContributionPhase = {
  id: string;
  /** Whole years this phase lasts. Ignored for the *last* phase, which always
   *  runs until retirement age. */
  years: number;
  /** Amount invested every month during this phase. */
  monthlyContribution: number;
};

export type WithdrawalMode = "fixed" | "spendDown";
/** Whether the entered/target amount is after-tax spending or the pre-tax sale. */
export type WithdrawalBasis = "net" | "gross";

export type RetirementSettings = {
  enabled: boolean;
  /** "fixed" = withdraw a set amount; "spendDown" = take out as much as
   *  possible so the balance hits ≈0 at life expectancy. */
  mode: WithdrawalMode;
  /** Does the amount mean net (after-tax spending) or gross (amount sold)? */
  basis: WithdrawalBasis;
  /** Amount withdrawn every month (used in "fixed" mode), in `basis` terms. */
  monthlyWithdrawal: number;
  /** Expected yearly return while retired (often lower / more conservative). */
  annualReturnPct: number;
  /** Capital-gains tax on the realised gain portion, in percent (Finland: 30). */
  capitalGainsTaxPct: number;
  /** Apply Finland's presumed acquisition cost (caps taxable gain at 60% of sale). */
  usePresumedCost: boolean;
  /** Optional kansaneläke (state pension) gross €/month when it starts; 0 = off.
   *  External income — added to monthly income, never touches the portfolio. */
  kansanelake: number;
  /** Tax rate on the kansaneläke, in percent. */
  kansanelakeTaxPct: number;
  /** Age the kansaneläke starts paying (may differ from retirement age). */
  kansanelakeStartAge: number;
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
  /** Years the final ("until retirement") phase actually covers. */
  lastPhaseYears: number;
  /** True when earlier phases already overrun the time to retirement. */
  phasesOverflow: boolean;
  startingBalance: number;
  /** Balance the moment saving stops / retirement starts. */
  endOfAccumulationBalance: number;
  /** Balance at the very end of the projection. */
  finalBalance: number;
  /** Sum of all monthly contributions (excludes the starting balance). */
  totalContributions: number;
  /** Investment gains earned during the saving phase. */
  accumulationGrowth: number;
  /** Total gross amount sold from the portfolio during retirement. */
  totalWithdrawn: number;
  /** Total after-tax money the retiree got to spend. */
  totalNet: number;
  /** Total capital-gains tax paid during retirement. */
  totalTax: number;
  withdrawalMode: WithdrawalMode;
  withdrawalBasis: WithdrawalBasis;
  /** First-year monthly figures (what to display). */
  firstMonthlyNet: number;
  firstMonthlyGross: number;
  /** Final-year monthly figures (after inflation step-ups). */
  lastMonthlyNet: number;
  lastMonthlyGross: number;
  /** Kansaneläke (state pension) — external income, additive only. */
  pensionStartAge: number;
  /** Net kansaneläke per month at the moment it starts (0 if none). */
  pensionNetMonthly: number;
  /** Total net kansaneläke received over retirement. */
  totalPensionNet: number;
  /** First-/final-year total monthly net income = investment net + pension net. */
  firstMonthlyTotalNet: number;
  lastMonthlyTotalNet: number;
  /** Combined monthly net income (investment + pension) from the pension start age. */
  monthlyTotalIncomeWithPension: number;
  /** Fractional year (from today) the money runs out, or null if it lasts. */
  depletionYear: number | null;
  /** Age the money runs out, or null if it lasts. */
  depletionAge: number | null;
  /** Years into retirement the money runs out (0 when it lasts). */
  depletionIntoRetirement: number;
  /** Final balance expressed in today's money. */
  realFinalBalance: number;
};

// Finland's "hankintameno-olettama" for holdings ≥ 10 years: deduct 40% of the
// sale price as presumed cost, so at most 60% of the sale is taxable gain.
const PRESUMED_TAXABLE_RATE = 0.6;

const num = (v: number): number => (Number.isFinite(v) ? v : 0);

const numOr = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

/** Convert a yearly percentage into the equivalent monthly growth factor. */
function monthlyRate(annualReturnPct: number): number {
  return Math.pow(1 + num(annualReturnPct) / 100, 1 / 12) - 1;
}

type RetSimOpts = {
  startBalance: number;
  startCostBasis: number;
  retRate: number;
  months: number;
  inflation: number;
  /** Year-1 monthly amount, in `isNet` terms; later years step up with inflation. */
  base: number;
  isNet: boolean;
  taxRate: number; // fraction, e.g. 0.30
  usePresumed: boolean;
  accMonths: number; // offset so depletion is reported as a global month
};

type RetSim = {
  finalBalance: number;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  depletionMonth: number | null;
  yearEndBalances: number[];
  /** Investment net at the first month of each retirement year. */
  yearFirstMonthNets: number[];
  firstMonthNet: number;
  firstMonthGross: number;
  lastYearNet: number;
  lastYearGross: number;
};

/**
 * Month-by-month retirement drawdown with capital-gains tax.
 *
 * Each month: the balance grows, then a gross amount is sold. The realised gain
 * is the sold fraction of the portfolio's embedded gain (average cost basis);
 * tax is `taxRate` on that gain (optionally capped by the presumed-cost rule).
 * In "net" mode the sale is grossed up so the after-tax amount equals the target.
 */
function simulateRetirement(o: RetSimOpts): RetSim {
  let balance = o.startBalance;
  let costBasis = o.startCostBasis;
  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;
  let depletionMonth: number | null = null;
  const yearEndBalances: number[] = [];
  const yearFirstMonthNets: number[] = [];
  let firstMonthNet = 0;
  let firstMonthGross = 0;
  let lastYearNet = 0;
  let lastYearGross = 0;
  const years = Math.ceil(o.months / 12);

  for (let j = 0; j < o.months; j++) {
    const yearIndex = Math.floor(j / 12);
    const stepped = o.base * Math.pow(1 + o.inflation, yearIndex);
    const grown = balance * (1 + o.retRate);
    const gainFrac = grown > 0 ? Math.max(0, (grown - costBasis) / grown) : 0;
    const taxableRate = o.usePresumed
      ? Math.min(gainFrac, PRESUMED_TAXABLE_RATE)
      : gainFrac;
    const taxPerGross = o.taxRate * taxableRate; // tax as a fraction of the sale

    let gross = o.isNet
      ? taxPerGross < 1
        ? stepped / (1 - taxPerGross)
        : Infinity
      : stepped;

    let tax: number;
    let net: number;
    // Negated so an Infinity/NaN gross (from the net gross-up when tax ≥ 100%)
    // also lands here rather than slipping through the `<` comparison.
    if (!(gross < grown)) {
      // Not enough left — liquidate the remainder.
      gross = grown;
      tax = gross * taxPerGross;
      net = gross - tax;
      balance = 0;
      costBasis = 0;
      if (depletionMonth === null) depletionMonth = o.accMonths + j + 1;
    } else {
      tax = gross * taxPerGross;
      net = gross - tax;
      const fractionSold = grown > 0 ? gross / grown : 0;
      costBasis = costBasis * (1 - fractionSold);
      balance = grown - gross;
    }

    totalGross += gross;
    totalTax += tax;
    totalNet += net;

    if (j % 12 === 0) yearFirstMonthNets.push(net);
    if (j === 0) {
      firstMonthNet = net;
      firstMonthGross = gross;
    }
    if (j === (years - 1) * 12) {
      lastYearNet = net;
      lastYearGross = gross;
    }
    if ((j + 1) % 12 === 0) yearEndBalances.push(balance);
  }

  return {
    finalBalance: balance,
    totalGross,
    totalNet,
    totalTax,
    depletionMonth,
    yearEndBalances,
    yearFirstMonthNets,
    firstMonthNet,
    firstMonthGross,
    lastYearNet,
    lastYearGross,
  };
}

// Spend-down solver parameters (see solveSpendDownBase).
const BISECTION_ITERATIONS = 80; // halvings — well past float precision for euros
const EXPANSION_GUARD_LIMIT = 100; // safety cap while doubling the search's upper bound
const DEPLETION_TOLERANCE_EUR = 0.5; // a final balance under this counts as "≈0"

/**
 * Year-1 monthly base (net or gross per `isNet`) that drains the pot to ≈0 at the
 * end. Tax + the presumed-cost cap make this non-linear, so we bisect — the final
 * balance is monotonically decreasing in the base, so this converges quickly.
 */
function solveSpendDownBase(options: Omit<RetSimOpts, "base">): number {
  if (options.months <= 0 || options.startBalance <= 0) return 0;
  const finalBalanceFor = (base: number) =>
    simulateRetirement({ ...options, base }).finalBalance;

  let low = 0;
  let high = Math.max(1, options.startBalance / options.months);
  let expansions = 0;
  while (
    finalBalanceFor(high) > DEPLETION_TOLERANCE_EUR &&
    expansions++ < EXPANSION_GUARD_LIMIT
  )
    high *= 2;

  for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration++) {
    const mid = (low + high) / 2;
    if (finalBalanceFor(mid) > DEPLETION_TOLERANCE_EUR) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// A stored phase missing its `years` falls back to this (a sensible phase length).
const PHASE_FALLBACK_YEARS = 5;

/** A clean-slate calculation ("New"), and the single source of `normalizeInput`'s
 *  fallbacks — so the defaults can't drift between the two. */
export const EMPTY_INPUT: InvestingInput = {
  startingBalance: 0,
  annualReturnPct: 7,
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 90,
  phases: [{ id: "phase-new", years: 10, monthlyContribution: 100 }],
  retirement: {
    enabled: false,
    mode: "fixed",
    basis: "net",
    monthlyWithdrawal: 1500,
    annualReturnPct: 4,
    capitalGainsTaxPct: 30,
    usePresumedCost: true,
    kansanelake: 0,
    kansanelakeTaxPct: 0,
    kansanelakeStartAge: 65,
  },
  inflationPct: 0,
};

/** The worked example shown on first visit and on "Reset to example". */
export const DEFAULT_INPUT: InvestingInput = {
  startingBalance: 10000,
  annualReturnPct: 7,
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 90,
  phases: [
    { id: "phase-a", years: 1, monthlyContribution: 100 },
    { id: "phase-b", years: 4, monthlyContribution: 250 },
    { id: "phase-c", years: 25, monthlyContribution: 400 },
  ],
  retirement: {
    enabled: true,
    mode: "fixed",
    basis: "net",
    monthlyWithdrawal: 2500,
    annualReturnPct: 5,
    capitalGainsTaxPct: 30,
    usePresumedCost: true,
    kansanelake: 0,
    kansanelakeTaxPct: 0,
    kansanelakeStartAge: 65,
  },
  inflationPct: 0,
};

/** Fill in any missing/invalid fields — used when loading saved or older data. */
export function normalizeInput(
  partial: Partial<InvestingInput> | null | undefined,
): InvestingInput {
  const source = partial ?? {};
  const retirementDefaults = EMPTY_INPUT.retirement;
  const phases =
    Array.isArray(source.phases) && source.phases.length > 0
      ? source.phases
      : EMPTY_INPUT.phases;
  return {
    startingBalance: numOr(source.startingBalance, EMPTY_INPUT.startingBalance),
    annualReturnPct: numOr(source.annualReturnPct, EMPTY_INPUT.annualReturnPct),
    currentAge: numOr(source.currentAge, EMPTY_INPUT.currentAge),
    retirementAge: numOr(source.retirementAge, EMPTY_INPUT.retirementAge),
    lifeExpectancy: numOr(source.lifeExpectancy, EMPTY_INPUT.lifeExpectancy),
    phases: phases.map((phase, index) => ({
      id: typeof phase?.id === "string" ? phase.id : `phase-${index + 1}`,
      years: numOr(phase?.years, PHASE_FALLBACK_YEARS),
      monthlyContribution: numOr(phase?.monthlyContribution, 0),
    })),
    retirement: {
      enabled: Boolean(source.retirement?.enabled),
      mode: source.retirement?.mode === "spendDown" ? "spendDown" : "fixed",
      basis: source.retirement?.basis === "gross" ? "gross" : "net",
      monthlyWithdrawal: numOr(
        source.retirement?.monthlyWithdrawal,
        retirementDefaults.monthlyWithdrawal,
      ),
      annualReturnPct: numOr(
        source.retirement?.annualReturnPct,
        retirementDefaults.annualReturnPct,
      ),
      capitalGainsTaxPct: numOr(
        source.retirement?.capitalGainsTaxPct,
        retirementDefaults.capitalGainsTaxPct,
      ),
      usePresumedCost: source.retirement?.usePresumedCost !== false,
      kansanelake: numOr(source.retirement?.kansanelake, retirementDefaults.kansanelake),
      kansanelakeTaxPct: numOr(
        source.retirement?.kansanelakeTaxPct,
        retirementDefaults.kansanelakeTaxPct,
      ),
      kansanelakeStartAge: numOr(
        source.retirement?.kansanelakeStartAge,
        retirementDefaults.kansanelakeStartAge,
      ),
    },
    inflationPct: numOr(source.inflationPct, EMPTY_INPUT.inflationPct),
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
 *  - The starting balance is treated as having a cost basis equal to its value.
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
  // Cost basis at retirement = everything paid in (no sales happened yet).
  const costBasisAtRetirement = startingBalance + totalContributions;

  // ---- Retirement phase ----
  const ret = input.retirement;
  const isNet = ret.basis === "net";
  const simBase: Omit<RetSimOpts, "base"> = {
    startBalance: endOfAccumulationBalance,
    startCostBasis: costBasisAtRetirement,
    retRate: monthlyRate(ret.annualReturnPct),
    months: retirementYears * 12,
    inflation,
    isNet,
    taxRate: Math.max(0, num(ret.capitalGainsTaxPct)) / 100,
    usePresumed: ret.usePresumedCost,
    accMonths,
  };

  const base =
    ret.mode === "spendDown"
      ? solveSpendDownBase(simBase)
      : Math.max(0, num(ret.monthlyWithdrawal));
  const sim = simulateRetirement({ ...simBase, base });

  // Retirement year points.
  for (let k = 0; k < sim.yearEndBalances.length; k++) {
    const year = accumulationYears + k + 1;
    const bal = sim.yearEndBalances[k];
    points.push({
      year,
      age: currentAge + year,
      stage: "retirement",
      balance: bal,
      contributed,
      realBalance: bal / realFactor(year),
    });
  }

  const totalYears = accumulationYears + retirementYears;
  const depletionYear =
    sim.depletionMonth === null ? null : sim.depletionMonth / 12;
  const depletionIntoRetirement =
    depletionYear === null ? 0 : Math.max(0, depletionYear - accumulationYears);

  // Phase coverage: earlier phases have explicit durations; the last fills what's
  // left up to retirement (0 if the earlier phases already overrun it).
  const nonLastPhaseYears = input.phases
    .slice(0, -1)
    .reduce((sum, phase) => sum + Math.max(0, Math.floor(num(phase.years))), 0);
  const lastPhaseYears = Math.max(0, accumulationYears - nonLastPhaseYears);
  const phasesOverflow = nonLastPhaseYears > accumulationYears;

  // ---- Kansaneläke (state pension): external income, additive only ----
  // The entered amount is the monthly net-of-its-own-tax base when the pension
  // starts; it rises with inflation from there. It never touches the portfolio.
  const pensionNetAtStart =
    Math.max(0, num(ret.kansanelake)) *
    (1 - Math.max(0, num(ret.kansanelakeTaxPct)) / 100);
  const pensionStartYearIndex = Math.max(
    0,
    Math.floor(num(ret.kansanelakeStartAge) - retirementAge)
  );
  const pensionNetForYear = (r: number): number =>
    r >= pensionStartYearIndex
      ? pensionNetAtStart * Math.pow(1 + inflation, r - pensionStartYearIndex)
      : 0;

  let totalPensionNet = 0;
  for (let r = 0; r < retirementYears; r++) totalPensionNet += pensionNetForYear(r) * 12;
  const pensionFirst = retirementYears > 0 ? pensionNetForYear(0) : 0;
  const pensionLast =
    retirementYears > 0 ? pensionNetForYear(retirementYears - 1) : 0;
  // Combined income at the year the pension starts: investment net there (already
  // inflation-stepped) plus the pension's starting net.
  const investNetAtPensionStart =
    pensionStartYearIndex < sim.yearFirstMonthNets.length
      ? sim.yearFirstMonthNets[pensionStartYearIndex]
      : 0;
  const monthlyTotalIncomeWithPension = investNetAtPensionStart + pensionNetAtStart;

  return {
    points,
    currentAge,
    retirementAge,
    lifeExpectancy,
    accumulationYears,
    retirementYears,
    totalYears,
    lastPhaseYears,
    phasesOverflow,
    startingBalance,
    endOfAccumulationBalance,
    finalBalance: sim.finalBalance,
    totalContributions,
    accumulationGrowth,
    totalWithdrawn: sim.totalGross,
    totalNet: sim.totalNet,
    totalTax: sim.totalTax,
    withdrawalMode: ret.mode,
    withdrawalBasis: ret.basis,
    firstMonthlyNet: sim.firstMonthNet,
    firstMonthlyGross: sim.firstMonthGross,
    lastMonthlyNet: sim.lastYearNet,
    lastMonthlyGross: sim.lastYearGross,
    pensionStartAge: num(ret.kansanelakeStartAge),
    pensionNetMonthly: pensionNetAtStart,
    totalPensionNet,
    firstMonthlyTotalNet: sim.firstMonthNet + pensionFirst,
    lastMonthlyTotalNet: sim.lastYearNet + pensionLast,
    monthlyTotalIncomeWithPension,
    depletionYear,
    depletionAge: depletionYear === null ? null : currentAge + depletionYear,
    depletionIntoRetirement,
    realFinalBalance: sim.finalBalance / realFactor(totalYears),
  };
}
