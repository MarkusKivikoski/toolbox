// Format-agnostic spreadsheet rows built from a computed projection. Both the CSV
// and XLSX exporters consume these, so the layout lives in one place. Numbers are
// left as raw numbers (rounded to cents) — exporters decide how to render them.

import type {
  ContributionPhase,
  InvestingInput,
  InvestingResult,
} from "./investing";

export type Cell = string | number;

const round2 = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const modeLabel = (mode: InvestingInput["retirement"]["mode"]): string =>
  mode === "spendDown" ? "Spend it all" : "Fixed amount";

const basisLabel = (basis: InvestingInput["retirement"]["basis"]): string =>
  basis === "gross" ? "Gross (pre-tax)" : "Net (after tax)";

const phaseDuration = (phase: ContributionPhase, isLast: boolean): Cell =>
  isLast ? "until retirement" : Math.max(0, Math.round(phase.years));

/** Inputs / assumptions, as label–value rows (with a small phases sub-table). */
export function buildInputRows(input: InvestingInput): Cell[][] {
  const retirement = input.retirement;
  const rows: Cell[][] = [
    ["Starting balance (€)", round2(input.startingBalance)],
    ["Expected yearly return (%)", input.annualReturnPct],
    ["Current age", input.currentAge],
    ["Retirement age", input.retirementAge],
    ["Life expectancy", input.lifeExpectancy],
    ["Inflation (%)", input.inflationPct],
    [],
    ["Contribution phases"],
    ["Phase", "Monthly (€)", "Duration"],
    ...input.phases.map((phase, index): Cell[] => [
      `Phase ${index + 1}`,
      round2(phase.monthlyContribution),
      phaseDuration(phase, index === input.phases.length - 1),
    ]),
    [],
    ["Retirement drawdown", retirement.enabled ? "enabled" : "disabled"],
  ];

  if (retirement.enabled) {
    rows.push(
      ["Withdrawal mode", modeLabel(retirement.mode)],
      ["Amount basis", basisLabel(retirement.basis)]
    );
    if (retirement.mode === "fixed") {
      rows.push(["Monthly withdrawal (€)", round2(retirement.monthlyWithdrawal)]);
    }
    rows.push(
      ["Return while retired (%)", retirement.annualReturnPct],
      ["Capital gains tax (%)", retirement.capitalGainsTaxPct],
      ["Hankintameno-olettama", retirement.usePresumedCost ? "applied" : "off"]
    );
    if (retirement.kansanelake > 0) {
      rows.push(
        ["Kansaneläke gross / month (€)", round2(retirement.kansanelake)],
        ["Pension tax (%)", retirement.kansanelakeTaxPct],
        ["Pension starts at age", retirement.kansanelakeStartAge]
      );
    }
  }

  return rows;
}

/** Headline results, as label–value rows. */
export function buildSummaryRows(
  result: InvestingResult,
  input: InvestingInput
): Cell[][] {
  const rows: Cell[][] = [
    [`Balance at retirement — age ${result.retirementAge} (€)`, round2(result.endOfAccumulationBalance)],
    ["Total contributions (€)", round2(result.totalContributions)],
    ["Investment growth (€)", round2(result.accumulationGrowth)],
  ];

  if (input.retirement.enabled) {
    let outcome: string;
    if (result.withdrawalMode === "spendDown") {
      outcome = `Spends down to ≈€0 by age ${result.lifeExpectancy}`;
    } else if (result.depletionAge === null) {
      outcome = `Lasts to age ${result.lifeExpectancy}`;
    } else {
      outcome = `Runs out at age ${Math.floor(result.depletionAge)}`;
    }
    rows.push(
      [],
      ["Total withdrawn — gross (€)", round2(result.totalWithdrawn)],
      ["Total net spent (€)", round2(result.totalNet)],
      ["Total capital gains tax (€)", round2(result.totalTax)],
      ["First-year net / month (€)", round2(result.firstMonthlyNet)],
      ["First-year gross / month (€)", round2(result.firstMonthlyGross)],
      ["Final-year net / month (€)", round2(result.lastMonthlyNet)],
      ["Final-year gross / month (€)", round2(result.lastMonthlyGross)],
      ["Final balance (€)", round2(result.finalBalance)],
      ["Outcome", outcome]
    );
    if (input.retirement.kansanelake > 0) {
      rows.push(
        [],
        ["Kansaneläke net / month (€)", round2(result.pensionNetMonthly)],
        ["Total kansaneläke net (€)", round2(result.totalPensionNet)],
        ["First-year total income net / month (€)", round2(result.firstMonthlyTotalNet)]
      );
      if (input.retirement.kansanelakeStartAge > input.retirementAge) {
        rows.push([
          `Total income with pension — from age ${input.retirement.kansanelakeStartAge} / month (€)`,
          round2(result.monthlyTotalIncomeWithPension),
        ]);
      }
    }
  }

  return rows;
}

/** Year-by-year projection: a header row followed by one row per year. */
export function buildProjectionRows(result: InvestingResult): Cell[][] {
  const header: Cell[] = [
    "Age",
    "Year",
    "Stage",
    "Invested to date (€)",
    "Balance (€)",
    "Today's money (€)",
  ];
  const data: Cell[][] = result.points.map((point) => [
    point.age,
    point.year,
    point.stage === "retirement" ? "Retired" : "Saving",
    round2(point.contributed),
    round2(point.balance),
    round2(point.realBalance),
  ]);
  return [header, ...data];
}
