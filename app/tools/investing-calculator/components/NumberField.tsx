import { useState } from "react";
import { parseAmount } from "@/lib/utils";

/** The empty-means-zero display rule: a 0 value shows as an empty input. */
const toDisplayText = (value: number): string =>
  value === 0 ? "" : String(value);

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  hintTone?: "muted" | "warn";
  min?: number;
};

/**
 * Text input that round-trips through a number while letting you type
 * intermediate values like "7." or a comma decimal separator.
 *
 * (Deliberately not merged with budget-visualizer's EuroField: that one is
 * string-in/string-out with the parent owning the raw text, while this one is
 * number-in/number-out with an internal text buffer for the round-trip.)
 */
export default function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  hintTone = "muted",
  min = 0,
}: NumberFieldProps) {
  const [text, setText] = useState(toDisplayText(value));

  // Sync the text when the numeric prop changes from outside (loading a saved
  // calculation, phase edits) without clobbering in-progress typing like
  // "7." — the React "adjust state during render" pattern.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (parseAmount(text) !== value) setText(toDisplayText(value));
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 text-base text-zinc-400 sm:text-sm">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={text}
          placeholder="0"
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            onChange(Math.max(min, parseAmount(raw)));
          }}
          className={`w-full rounded-lg border border-zinc-300 bg-white py-2.5 text-base tabular-nums shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 sm:py-2 sm:text-sm ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-9" : "pr-3"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-base text-zinc-400 sm:text-sm">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <span
          className={`mt-1 block text-xs ${
            hintTone === "warn"
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-400"
          }`}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
