"use client";

import { convertAmount } from "@/lib/currency-converter";
import { parseAmount } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, currencyInfoFor } from "./currencies.config";
import { usePersistedConverterSettings } from "./hooks/usePersistedConverterSettings";
import { useExchangeRates } from "./hooks/useExchangeRates";
import AmountInput from "./components/AmountInput";
import TargetCurrencyRow from "./components/TargetCurrencyRow";
import AddCurrencyPicker from "./components/AddCurrencyPicker";
import RatesNotice from "./components/RatesNotice";

export default function CurrencyConverter() {
  const { settings, setSettings, hydrated } = usePersistedConverterSettings();
  const { baseCurrency, amount, targetCurrencies } = settings;

  const { ratesState, onRetry } = useExchangeRates(
    [baseCurrency, ...targetCurrencies],
    hydrated,
  );
  const snapshot =
    ratesState.status === "fresh" || ratesState.status === "stale"
      ? ratesState.snapshot
      : null;

  const amountValue = parseAmount(amount);
  const usedCodes = new Set([baseCurrency, ...targetCurrencies]);
  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    (currency) => !usedCodes.has(currency.code),
  );

  const handleAmountChange = (value: string) =>
    setSettings((previous) => ({ ...previous, amount: value }));

  const handleBaseCurrencyChange = (code: string) =>
    setSettings((previous) => ({
      ...previous,
      baseCurrency: code,
      targetCurrencies: previous.targetCurrencies.filter(
        (target) => target !== code,
      ),
    }));

  const handleAddCurrency = (code: string) =>
    setSettings((previous) => ({
      ...previous,
      targetCurrencies: [...previous.targetCurrencies, code],
    }));

  const handleRemoveCurrency = (code: string) =>
    setSettings((previous) => ({
      ...previous,
      targetCurrencies: previous.targetCurrencies.filter(
        (target) => target !== code,
      ),
    }));

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <AmountInput
          amount={amount}
          baseCurrency={baseCurrency}
          onAmountChange={handleAmountChange}
          onBaseCurrencyChange={handleBaseCurrencyChange}
        />
      </div>

      <RatesNotice ratesState={ratesState} onRetry={onRetry} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        {targetCurrencies.length > 0 ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {targetCurrencies.map((code) => {
              const currency = currencyInfoFor(code);
              if (!currency) return null;
              return (
                <TargetCurrencyRow
                  key={code}
                  currency={currency}
                  convertedAmount={
                    snapshot
                      ? convertAmount(amountValue, baseCurrency, code, snapshot)
                      : null
                  }
                  onRemove={() => handleRemoveCurrency(code)}
                />
              );
            })}
          </ul>
        ) : (
          <p className="pb-3 text-sm text-zinc-500">
            No currencies yet — add one below.
          </p>
        )}
        <AddCurrencyPicker
          availableCurrencies={availableCurrencies}
          onAdd={handleAddCurrency}
        />
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        {ratesState.status === "loading"
          ? "Fetching the latest rates…"
          : snapshot
            ? `Daily reference rates from ${snapshot.ratesDate}, via the free Frankfurter API (ECB and 80+ central banks).`
            : "Daily reference rates via the free Frankfurter API (ECB and 80+ central banks)."}
      </p>
    </div>
  );
}
