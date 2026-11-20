import type { Mode, SavingsState } from "@/lib/budget";
import EuroField from "./EuroField";

type Props = {
  mode: Mode;
  savings: SavingsState;
  onChange: (patch: Partial<SavingsState>) => void;
};

/** The savings toggle plus its mode-specific inputs (balance/target vs. pace/deadline). */
export default function SavingsInputs({ mode, savings, onChange }: Props) {
  return (
    <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
      <label className="flex cursor-pointer select-none items-center gap-2.5">
        <input
          type="checkbox"
          checked={savings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-600"
        />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <p>Säästölaskuri</p>
        </span>
      </label>

      {savings.enabled &&
        (mode === "salary" ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <EuroField
              label="Nykyiset säästöt"
              value={savings.balance}
              onChange={(value) => onChange({ balance: value })}
              ariaLabel="Nykyiset säästöt"
            />
            <EuroField
              label="Säästötavoite"
              value={savings.target}
              onChange={(value) => onChange({ target: value })}
              ariaLabel="Säästötavoite"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <EuroField
                label="Nykyiset säästöt"
                value={savings.balance}
                onChange={(value) => onChange({ balance: value })}
                ariaLabel="Nykyiset säästöt"
              />
              <EuroField
                label="Säästö kuukaudessa"
                value={savings.perMonth}
                onChange={(value) => onChange({ perMonth: value })}
                ariaLabel="Säästö kuukaudessa"
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Kuukausia matkaan (valinnainen)
              </span>
              <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
                <input
                  type="text"
                  inputMode="numeric"
                  value={savings.monthsUntilTrip}
                  onChange={(e) =>
                    onChange({ monthsUntilTrip: e.target.value })
                  }
                  placeholder="esim. 6"
                  aria-label="Kuukausia matkaan"
                  className="w-full min-w-0 bg-transparent py-2.5 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
                />
                <span className="pl-1 text-xs text-zinc-400">kk</span>
              </div>
            </label>
          </div>
        ))}
    </div>
  );
}
