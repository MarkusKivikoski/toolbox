"use client";

import { useEffect, useMemo, useState } from "react";
import {
  annualInflation,
  convert,
  eraFor,
  inEraCurrency,
  isYearAvailable,
  MAX_YEAR,
  priceChange,
  yearsDescending,
} from "@/lib/cost-of-living";
import { formatEur } from "@/lib/format";
import PurchasingPowerChart from "./PurchasingPowerChart";

type Kind = "net" | "gross";

type State = {
  amount: string;
  kind: Kind;
  fromYear: number;
  toYear: number;
};

const STATE_KEY = "toolbox.cost-of-living.state.v1";

const DEFAULT_STATE: State = {
  amount: "3000",
  kind: "gross",
  fromYear: MAX_YEAR,
  toYear: 2000,
};

const YEARS = yearsDescending();

const pctFmt = new Intl.NumberFormat("fi-FI", {
  style: "percent",
  maximumFractionDigits: 1,
});
const mkFmt = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });

function formatPct(frac: number): string {
  if (!Number.isFinite(frac)) return "–";
  return `${frac > 0 ? "+" : ""}${pctFmt.format(frac)}`;
}

/** Parse a free-typed euro figure, tolerating spaces and a comma decimal. */
function parseAmount(s: string): number {
  const cleaned = s
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeState(s: unknown): State {
  const o = (s ?? {}) as Partial<State>;
  return {
    amount: typeof o.amount === "string" ? o.amount : DEFAULT_STATE.amount,
    kind: o.kind === "net" || o.kind === "gross" ? o.kind : DEFAULT_STATE.kind,
    fromYear:
      typeof o.fromYear === "number" && isYearAvailable(o.fromYear)
        ? o.fromYear
        : DEFAULT_STATE.fromYear,
    toYear:
      typeof o.toYear === "number" && isYearAvailable(o.toYear)
        ? o.toYear
        : DEFAULT_STATE.toYear,
  };
}

export default function CostOfLiving() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) setState(normalizeState(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const { amount: amountStr, kind, fromYear, toYear } = state;
  const amount = useMemo(() => parseAmount(amountStr), [amountStr]);

  const equivalent = convert(amount, fromYear, toYear);
  const era = eraFor(toYear);
  const sameYear = fromYear === toYear;
  const hasAmount = amount > 0;

  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
  const swapYears = () => set({ fromYear: toYear, toYear: fromYear });

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="col-amount"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Monthly salary
          </label>
          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            {(["net", "gross"] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => set({ kind: k })}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  kind === k
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="text-2xl font-semibold text-zinc-400">€</span>
          <input
            id="col-amount"
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => set({ amount: e.target.value })}
            placeholder="0"
            className="w-full bg-transparent py-3 pl-2 text-2xl font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
          <div>
            <label
              htmlFor="col-from"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Salary year
            </label>
            <select
              id="col-from"
              value={fromYear}
              onChange={(e) => set({ fromYear: Number(e.target.value) })}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base font-medium tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swapYears}
            aria-label="Swap years"
            title="Swap years"
            className="mb-0.5 rounded-xl border border-zinc-300 p-2.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M7 4 4 7l3 3M4 7h9M13 16l3-3-3-3m3 3H7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div>
            <label
              htmlFor="col-to"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Compare to
            </label>
            <select
              id="col-to"
              value={toYear}
              onChange={(e) => set({ toYear: Number(e.target.value) })}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base font-medium tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      {!hasAmount ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
          Enter a salary to see what it was worth.
        </div>
      ) : sameYear ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Pick two different years to compare buying power.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatEur(amount)} {kind}
            </span>{" "}
            in {fromYear} had the same buying power as
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-4xl">
              {formatEur(equivalent)}
            </span>
            <span className="text-lg font-medium text-zinc-500">in {toYear}</span>
          </div>

          {era.code !== "EUR" && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              ≈{" "}
              <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                {mkFmt.format(inEraCurrency(equivalent, toYear))} {era.unit}
              </span>{" "}
              — what Finns actually paid in markka back then
            </p>
          )}

          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Prices in Finland were{" "}
            <span className="font-semibold">
              {pctFmt.format(Math.abs(priceChange(fromYear, toYear)))}
            </span>{" "}
            {priceChange(fromYear, toYear) < 0 ? "lower" : "higher"} in {toYear} than in{" "}
            {fromYear}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Cumulative inflation
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatPct(priceChange(Math.min(fromYear, toYear), Math.max(fromYear, toYear)))}
              </div>
              <div className="text-xs text-zinc-400">
                {Math.min(fromYear, toYear)} → {Math.max(fromYear, toYear)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Average per year
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatPct(annualInflation(fromYear, toYear))}
              </div>
              <div className="text-xs text-zinc-400">
                over {Math.abs(toYear - fromYear)} years
              </div>
            </div>
          </div>

          <div className="mt-5">
            <PurchasingPowerChart amount={amount} fromYear={fromYear} toYear={toYear} />
          </div>
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Based on Statistics Finland&apos;s cost-of-living index (1914:1–6 = 100),
        annual averages 1860–{MAX_YEAR}. Net/gross is a label only — the figure is
        adjusted purely for changes in the price level. Markka amounts use the
        official 5.94573 mk/€ fixing.
      </p>
    </div>
  );
}
