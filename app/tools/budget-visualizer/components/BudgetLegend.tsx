import type { BudgetSlice } from "@/lib/budget";
import { PAID_COPY } from "../copy";
import type { SpendingActions } from "../hooks/useSpendingActions";
import BudgetLegendRow from "./BudgetLegendRow";
import LegendTotalRow from "./LegendTotalRow";

type Props = {
  slices: BudgetSlice[];
  income: number;
  allocated: number;
  paid: number;
  unpaid: number;
  labels: { allocated: string; paid: string; unpaid: string };
  emptyMessage: string;
  activeId: string | null;
  spendingActions: SpendingActions;
  onActiveChange: (id: string | null) => void;
  onTogglePaid: (id: string) => void;
  onClearPaid: () => void;
};

/**
 * The list beneath the doughnut: one row per slice with a "paid" tick and an
 * expandable spending log, plus allocated / paid / unpaid totals (the last two
 * once something is ticked).
 */
export default function BudgetLegend({
  slices,
  income,
  allocated,
  paid,
  unpaid,
  labels,
  emptyMessage,
  activeId,
  spendingActions,
  onActiveChange,
  onTogglePaid,
  onClearPaid,
}: Props) {
  if (slices.length === 0) {
    return <p className="mt-4 text-center text-sm text-zinc-400">{emptyMessage}</p>;
  }

  const hasPaid = paid > 0;
  const shareOfIncome = (amount: number) =>
    income > 0 ? amount / income : undefined;

  return (
    <ul className="mt-4 space-y-1">
      {slices.map((slice) => (
        <BudgetLegendRow
          key={slice.id}
          slice={slice}
          isActive={slice.id === activeId}
          spendingActions={spendingActions}
          onActiveChange={onActiveChange}
          onTogglePaid={onTogglePaid}
        />
      ))}

      <LegendTotalRow
        isFirst
        label={labels.allocated}
        amount={allocated}
        fraction={shareOfIncome(allocated)}
      />
      {hasPaid && (
        <>
          <LegendTotalRow
            label={labels.paid}
            amount={paid}
            fraction={shareOfIncome(paid)}
          />
          <LegendTotalRow
            label={labels.unpaid}
            amount={unpaid}
            fraction={shareOfIncome(unpaid)}
            successMessage={unpaid <= 0 ? PAID_COPY.allPaid : undefined}
          />
          <li className="flex justify-end px-2 pt-1">
            <button
              type="button"
              onClick={onClearPaid}
              className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
            >
              {PAID_COPY.clearPaid}
            </button>
          </li>
        </>
      )}
    </ul>
  );
}
