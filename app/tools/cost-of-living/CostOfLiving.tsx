"use client";

import { useMemo } from "react";
import { MAX_YEAR, type State } from "@/lib/cost-of-living";
import { parseAmount } from "@/lib/utils";
import { usePersistedCostOfLivingState } from "./hooks/usePersistedCostOfLivingState";
import SalaryRow from "./components/SalaryRow";
import ComparisonEmptyState from "./components/ComparisonEmptyState";
import ComparisonResult from "./components/ComparisonResult";

export default function CostOfLiving() {
  const { state, setState, hydrated } = usePersistedCostOfLivingState();

  const { yearA, salaryA, yearB, salaryB } = state;
  const salaryANum = useMemo(() => parseAmount(salaryA), [salaryA]);
  const salaryBNum = useMemo(() => parseAmount(salaryB), [salaryB]);

  const update = (patch: Partial<State>) =>
    setState((previous) => ({ ...previous, ...patch }));

  // Always frame the comparison chronologically so the wording is never backwards.
  const sameYear = yearA === yearB;
  const aIsEarlier = yearA <= yearB;
  const baselineYear = aIsEarlier ? yearA : yearB;
  const nowYear = aIsEarlier ? yearB : yearA;
  const baselineSalary = aIsEarlier ? salaryANum : salaryBNum;
  const nowSalary = aIsEarlier ? salaryBNum : salaryANum;
  const hasBaseline = baselineSalary > 0;

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Salary history
        </span>

        <div className="mt-4 space-y-4">
          <SalaryRow
            label="Earlier salary"
            year={yearA}
            salary={salaryA}
            onYear={(year) => update({ yearA: year })}
            onSalary={(value) => update({ salaryA: value })}
            yearId="col-year-a"
            salaryId="col-salary-a"
          />
          <SalaryRow
            label="Later salary"
            year={yearB}
            salary={salaryB}
            onYear={(year) => update({ yearB: year })}
            onSalary={(value) => update({ salaryB: value })}
            yearId="col-year-b"
            salaryId="col-salary-b"
          />
        </div>
      </div>

      {/* Result */}
      {sameYear ? (
        <ComparisonEmptyState variant="same-year" />
      ) : !hasBaseline ? (
        <ComparisonEmptyState variant="missing-baseline" baselineYear={baselineYear} />
      ) : (
        <ComparisonResult
          baselineYear={baselineYear}
          nowYear={nowYear}
          baselineSalary={baselineSalary}
          nowSalary={nowSalary}
        />
      )}

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Based on Statistics Finland&apos;s cost-of-living index (1914:1–6 = 100),
        annual averages 1860–{MAX_YEAR}. Figures are adjusted purely for changes
        in the price level.
      </p>
    </div>
  );
}
