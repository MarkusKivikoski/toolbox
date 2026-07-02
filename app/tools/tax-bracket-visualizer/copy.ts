// Static UI wording for the tax bracket visualizer, kept out of the components.

export const COPY = {
  salaryLabel: "Gross annual salary",
  municipalityLabel: "Municipality",
  customMunicipalityOption: "Custom rate…",
  customRateLabel: "Municipal tax rate",
  resultsHeading: "Your estimate",
  netAnnualLabel: "Net / year",
  netMonthlyLabel: "Net / month",
  effectiveRateLabel: "Effective rate",
  marginalRateLabel: "Marginal rate",
  marginalRateHint: "of your next €1",
  raiseHeading: "What if you got a raise?",
  raiseInputLabel: "Raise or bonus amount",
  disclaimer:
    "Rough estimate for tax year 2026. Counts only state tax, municipal tax and " +
    "employee TyEL + unemployment contributions with the automatic €750 " +
    "deduction — no työtulovähennys or perusvähennys credits, health insurance " +
    "contributions, Yle tax, church tax, itemized deductions or capital income. " +
    "Your real tax is likely somewhat lower.",
} as const;
