import type { BudgetSlice } from "@/lib/budget";
import { formatEur } from "@/lib/format";
import { pctFmt } from "../utils";

type Props = {
  slices: BudgetSlice[];
  income: number;
  allocated: number;
  allocatedLabel: string;
  emptyMessage: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

/** The list beneath the doughnut: one row per slice, plus an allocated-total footer. */
export default function BudgetLegend({
  slices,
  income,
  allocated,
  allocatedLabel,
  emptyMessage,
  activeId,
  onActiveChange,
}: Props) {
  if (slices.length === 0) {
    return <p className="mt-4 text-center text-sm text-zinc-400">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-4 space-y-1">
      {slices.map((slice) => {
        const isActive = slice.id === activeId;
        return (
          <li
            key={slice.id}
            onMouseEnter={() => onActiveChange(slice.id)}
            onMouseLeave={() => onActiveChange(null)}
            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
              isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""
            }`}
          >
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                slice.isRemainder ? "bg-zinc-200 dark:bg-zinc-700" : ""
              }`}
              style={{ backgroundColor: slice.color ?? undefined }}
              aria-hidden
            />
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                slice.isRemainder
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {slice.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-zinc-400">
              {pctFmt.format(slice.fraction)}
            </span>
            <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatEur(slice.amount)}
            </span>
          </li>
        );
      })}

      {/* Total footer */}
      <li className="mt-1 flex items-center gap-3 border-t border-zinc-100 px-2 pt-2 dark:border-zinc-800">
        <span className="h-3 w-3 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-medium text-zinc-500">
          {allocatedLabel}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
          {income > 0 ? pctFmt.format(allocated / income) : ""}
        </span>
        <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatEur(allocated)}
        </span>
      </li>
    </ul>
  );
}
