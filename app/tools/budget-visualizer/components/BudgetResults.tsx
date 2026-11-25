import {
  computeStatusPill,
  computeTripHeadline,
  type BudgetSummary,
  type Mode,
  type SavingsProjection,
  type SavingsState,
  type TripSavings,
} from "@/lib/budget";
import { parseAmount } from "@/lib/utils";
import { COPY, TONE } from "../copy";
import type { SpendingActions } from "../hooks/useSpendingActions";
import BudgetDoughnut from "./BudgetDoughnut";
import BudgetLegend from "./BudgetLegend";
import SalarySavingsPanel from "./SalarySavingsPanel";
import TripSavingsPanel from "./TripSavingsPanel";

type Props = {
  mode: Mode;
  summary: BudgetSummary;
  savings: SavingsState;
  salaryProj: SavingsProjection;
  tripProj: TripSavings;
  activeId: string | null;
  spendingActions: SpendingActions;
  onActiveChange: (id: string | null) => void;
  onTogglePaid: (id: string) => void;
  onClearPaid: () => void;
};

/** Doughnut, status pill, legend and the savings projection for the active plan. */
export default function BudgetResults({
  mode,
  summary,
  savings,
  salaryProj,
  tripProj,
  activeId,
  spendingActions,
  onActiveChange,
  onTogglePaid,
  onClearPaid,
}: Props) {
  const copy = COPY[mode];
  const { remaining, allocated, paid, unpaid, overBudget, slices, income } = summary;
  const perMonth = parseAmount(savings.perMonth);
  const monthsUntil = Math.max(0, Math.floor(parseAmount(savings.monthsUntilTrip)));
  const statusPill = computeStatusPill({
    mode,
    allocated,
    income,
    overBudget,
    remaining,
    savingsEnabled: savings.enabled,
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <BudgetDoughnut
        slices={slices}
        allocated={allocated}
        overBudget={overBudget}
        totalLabel={copy.doughnutCenter}
        subLabel={copy.doughnutSub}
        activeId={activeId}
        onActiveChange={onActiveChange}
      />

      <div
        className={`mx-auto mt-4 max-w-xs rounded-xl border px-4 py-2.5 text-center text-sm font-medium ${TONE[statusPill.tone]}`}
      >
        {statusPill.text}
      </div>

      <BudgetLegend
        slices={slices}
        income={income}
        allocated={allocated}
        paid={paid}
        unpaid={unpaid}
        labels={{
          allocated: copy.allocatedLabel,
          paid: copy.paidLabel,
          unpaid: copy.unpaidLabel,
        }}
        emptyMessage={copy.emptyDoughnut}
        activeId={activeId}
        spendingActions={spendingActions}
        onActiveChange={onActiveChange}
        onTogglePaid={onTogglePaid}
        onClearPaid={onClearPaid}
      />

      {savings.enabled && mode === "salary" && <SalarySavingsPanel proj={salaryProj} />}
      {savings.enabled && mode === "trip" && (
        <TripSavingsPanel
          proj={tripProj}
          headline={computeTripHeadline(tripProj, perMonth)}
          perMonth={perMonth}
          monthsUntil={monthsUntil}
        />
      )}
    </div>
  );
}
