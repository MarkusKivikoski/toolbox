import { memo } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

/** A small labelled euro input, used for the savings balance, target and pace. */
function EuroField({ label, value, onChange, ariaLabel }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-400">€</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          aria-label={ariaLabel}
          className="w-full min-w-0 bg-transparent py-2.5 pl-1 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
    </label>
  );
}

export default memo(EuroField);
