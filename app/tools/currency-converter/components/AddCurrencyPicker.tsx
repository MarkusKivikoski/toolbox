import type { CurrencyInfo } from "../currencies.config";

type Props = {
  availableCurrencies: readonly CurrencyInfo[];
  onAdd: (code: string) => void;
};

/** A select that appends one of the not-yet-listed currencies to the targets. */
export default function AddCurrencyPicker({ availableCurrencies, onAdd }: Props) {
  if (availableCurrencies.length === 0) return null;

  return (
    <select
      value=""
      onChange={(event) => {
        if (event.target.value !== "") onAdd(event.target.value);
      }}
      aria-label="Add a currency"
      className="w-full rounded-xl border border-dashed border-zinc-300 bg-transparent px-3 py-2.5 text-sm font-medium text-zinc-500 outline-none transition-colors hover:border-emerald-500 hover:text-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:hover:text-emerald-400"
    >
      <option value="">+ Add currency…</option>
      {availableCurrencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} — {currency.name}
        </option>
      ))}
    </select>
  );
}
