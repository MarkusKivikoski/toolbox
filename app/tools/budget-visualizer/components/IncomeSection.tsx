import type { BudgetRow } from "@/lib/budget";
import { formatEur } from "@/lib/format";
import RowEditor from "./RowEditor";
import AddButton from "./AddButton";

type Props = {
  heading: string;
  incomes: BudgetRow[];
  totalIncome: number;
  focusRowId: string | null;
  onAutoFocused: () => void;
  onName: (id: string, value: string) => void;
  onAmount: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
};

/** Salary-mode income list: any number of sources, with a running total. */
export default function IncomeSection({
  heading,
  incomes,
  totalIncome,
  focusRowId,
  onAutoFocused,
  onName,
  onAmount,
  onRemove,
  onAdd,
}: Props) {
  return (
    <>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {heading}
      </span>
      <div className="mt-2 space-y-2">
        {incomes.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No income sources yet — add one to start.
          </p>
        )}
        {incomes.map((row, index) => (
          <RowEditor
            key={row.id}
            row={row}
            ariaPrefix={`Income ${index + 1}`}
            namePlaceholder="Income source"
            fallbackNoun="income source"
            showDot={false}
            autoFocus={row.id === focusRowId}
            onAutoFocused={onAutoFocused}
            onName={(value) => onName(row.id, value)}
            onAmount={(value) => onAmount(row.id, value)}
            onRemove={() => onRemove(row.id)}
          />
        ))}
      </div>
      <AddButton label="Add income source" onClick={onAdd} />
      {incomes.length > 1 && (
        <div className="mt-2 flex items-center justify-end gap-2 px-1 text-sm">
          <span className="text-zinc-500">Total income</span>
          <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatEur(totalIncome)}
          </span>
        </div>
      )}
    </>
  );
}
