import { MONTH_COPY } from "../copy";
import type { MonthSource } from "../hooks/useBudgetActions";

type Props = {
  /** Label of the month a copy would come from, or null when there is none. */
  sourceMonthLabel: string | null;
  onStart: (source: MonthSource) => void;
};

/** Shown for a month with no budget yet: copy another month, try the example, or start blank. */
export default function EmptyMonthPrompt({ sourceMonthLabel, onStart }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-center dark:border-zinc-700">
      <p className="text-sm font-medium">{MONTH_COPY.emptyHeading}</p>
      <p className="mt-1 text-xs text-zinc-500">{MONTH_COPY.emptyHint}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => onStart(sourceMonthLabel ? "previous" : "example")}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {sourceMonthLabel
            ? MONTH_COPY.copyFrom(sourceMonthLabel)
            : MONTH_COPY.loadExample}
        </button>
        <button
          type="button"
          onClick={() => onStart("blank")}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
        >
          {MONTH_COPY.startBlank}
        </button>
      </div>
    </div>
  );
}
