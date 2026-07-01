import { useMemo } from "react";
import {
  computeBudget,
  computeSavings,
  computeTripSavings,
  type Mode,
  type PlanData,
} from "@/lib/budget";

/**
 * The doughnut summary and both savings projections for the active plan.
 * Salary mode saves the leftover; trip mode saves an explicit amount toward
 * the trip's total cost — so both are computed and the caller picks per mode.
 */
export function useBudgetProjections(mode: Mode, plan: PlanData) {
  const { incomes, sections, savings } = plan;

  const summary = useMemo(
    () =>
      computeBudget(
        incomes,
        sections,
        mode === "trip"
          ? "Under budget"
          : savings.enabled
            ? "To savings"
            : "Left to budget",
      ),
    [incomes, sections, mode, savings.enabled],
  );

  const salaryProj = useMemo(
    () => computeSavings(summary.remaining, savings.balance, savings.target),
    [summary.remaining, savings.balance, savings.target],
  );

  const tripProj = useMemo(
    () =>
      computeTripSavings(
        summary.total,
        savings.balance,
        savings.perMonth,
        savings.monthsUntilTrip,
      ),
    [summary.total, savings.balance, savings.perMonth, savings.monthsUntilTrip],
  );

  return { summary, salaryProj, tripProj };
}
