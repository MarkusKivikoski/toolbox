import { useState } from "react";
import type { MonthKey } from "@/lib/budget";
import { MONTH_COPY } from "../copy";
import { formatMonthLabel, shiftMonthKey } from "../utils";
import MonthPicker from "./MonthPicker";

const ARROW_BUTTON_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-lg text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50";

type Props = {
  month: MonthKey;
  startedMonths: MonthKey[];
  onMonthChange: (month: MonthKey) => void;
};

/** `‹ Marraskuu 2026 ›` stepper; the label opens a year grid for bigger jumps. */
export default function MonthSwitcher({ month, startedMonths, onMonthChange }: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handlePick = (picked: MonthKey) => {
    setIsPickerOpen(false);
    onMonthChange(picked);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonthKey(month, -1))}
          aria-label={MONTH_COPY.previous}
          className={ARROW_BUTTON_CLASS}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          aria-expanded={isPickerOpen}
          aria-label={MONTH_COPY.pickerToggle}
          className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
        >
          {formatMonthLabel(month)}
        </button>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonthKey(month, 1))}
          aria-label={MONTH_COPY.next}
          className={ARROW_BUTTON_CLASS}
        >
          ›
        </button>
      </div>
      {isPickerOpen && (
        <MonthPicker
          selectedMonth={month}
          startedMonths={startedMonths}
          onSelect={handlePick}
        />
      )}
    </div>
  );
}
