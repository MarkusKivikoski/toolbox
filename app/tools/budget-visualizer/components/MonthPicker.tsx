import { useState } from "react";
import type { MonthKey } from "@/lib/budget";
import { MONTH_COPY } from "../copy";
import { formatShortMonth, parseMonthKey, toMonthKey } from "../utils";

const MONTH_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

const NAV_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800";

type Props = {
  selectedMonth: MonthKey;
  /** Months that already hold a budget; marked with a dot. */
  startedMonths: MonthKey[];
  onSelect: (month: MonthKey) => void;
};

/** A year-at-a-time grid for jumping to any month, marking those already started. */
export default function MonthPicker({ selectedMonth, startedMonths, onSelect }: Props) {
  const [year, setYear] = useState(() => parseMonthKey(selectedMonth).year);

  return (
    <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear(year - 1)}
          aria-label={MONTH_COPY.previousYear}
          className={NAV_BUTTON_CLASS}
        >
          ‹
        </button>
        <span className="text-sm font-semibold tabular-nums">{year}</span>
        <button
          type="button"
          onClick={() => setYear(year + 1)}
          aria-label={MONTH_COPY.nextYear}
          className={NAV_BUTTON_CLASS}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {MONTH_NUMBERS.map((month) => {
          const key = toMonthKey(year, month);
          const isSelected = key === selectedMonth;
          const isStarted = startedMonths.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`relative rounded-lg px-2 py-2 text-sm transition-colors ${
                isSelected
                  ? "bg-emerald-600 font-medium text-white"
                  : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {formatShortMonth(month)}
              {isStarted && (
                <span
                  aria-hidden
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-emerald-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
