import { useLayoutEffect, useRef, type ChangeEvent } from "react";
import { editAmountInput } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, currencyInfoFor } from "../currencies.config";

type Props = {
  amount: string;
  baseCurrency: string;
  onAmountChange: (value: string) => void;
  onBaseCurrencyChange: (code: string) => void;
};

/** The base amount being converted: a currency picker and a free-typed
 *  figure, grouped with thousands spaces as you type so large figures
 *  (JPY-scale amounts, for instance) stay readable. */
export default function AmountInput({
  amount,
  baseCurrency,
  onAmountChange,
  onBaseCurrencyChange,
}: Props) {
  const baseSymbol = currencyInfoFor(baseCurrency)?.symbol ?? baseCurrency;
  const amountInputRef = useRef<HTMLInputElement>(null);
  // Where to put the caret after `amount` re-renders with grouping spaces
  // inserted or removed around it — set in the change handler, consumed here.
  const pendingCursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const cursor = pendingCursorRef.current;
    if (cursor === null) return;
    amountInputRef.current?.setSelectionRange(cursor, cursor);
    pendingCursorRef.current = null;
  }, [amount]);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const { formatted, cursor } = editAmountInput(
      input.value,
      input.selectionStart ?? input.value.length,
    );
    pendingCursorRef.current = cursor;
    onAmountChange(formatted);
  };

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Amount
      </div>
      <div className="grid grid-cols-[6.5rem_1fr] gap-2 sm:grid-cols-[8rem_1fr] sm:gap-3">
        <select
          id="converter-base-currency"
          value={baseCurrency}
          onChange={(event) => onBaseCurrencyChange(event.target.value)}
          aria-label="Base currency"
          className="w-full rounded-xl border border-zinc-300 bg-white px-2 py-2.5 text-base font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — {currency.name}
            </option>
          ))}
        </select>
        <div className="flex items-center rounded-xl border border-zinc-300 bg-zinc-50 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="text-lg font-semibold text-zinc-400">{baseSymbol}</span>
          <input
            ref={amountInputRef}
            id="converter-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            aria-label="Amount to convert"
            className="w-full min-w-0 bg-transparent py-2.5 pl-2 text-lg font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
        </div>
      </div>
    </div>
  );
}
