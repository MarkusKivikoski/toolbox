"use client";

import { useEffect, useMemo, useState } from "react";
import {
  annualInflation,
  convert,
  isYearAvailable,
  MAX_YEAR,
  priceChange,
  yearsDescending,
} from "@/lib/cost-of-living";
import { formatEur } from "@/lib/format";
import PurchasingPowerChart from "./PurchasingPowerChart";

type State = {
  yearA: number;
  salaryA: string;
  yearB: number;
  salaryB: string;
};

const STATE_KEY = "toolbox.cost-of-living.state.v2";
const LEGACY_KEY = "toolbox.cost-of-living.state.v1";

const DEFAULT_STATE: State = {
  yearA: 2015,
  salaryA: "3000",
  yearB: MAX_YEAR,
  salaryB: "3500",
};

const YEARS = yearsDescending();

const pctFmt = new Intl.NumberFormat("fi-FI", {
  style: "percent",
  maximumFractionDigits: 1,
});

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
  const year = (v: unknown, fallback: number) =>
    typeof v === "number" && isYearAvailable(v) ? v : fallback;
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;
  return {
    yearA: year(o.yearA, DEFAULT_STATE.yearA),
    salaryA: str(o.salaryA, DEFAULT_STATE.salaryA),
    yearB: year(o.yearB, DEFAULT_STATE.yearB),
    salaryB: str(o.salaryB, DEFAULT_STATE.salaryB),
  };
}

/** Carry a v1 single-salary save into pair A so returning users keep their figures. */
function fromLegacy(s: unknown): State {
  const o = (s ?? {}) as {
    amount?: string;
    fromYear?: number;
    toYear?: number;
  };
  return normalizeState({
    yearA: o.fromYear,
    salaryA: o.amount,
    yearB: o.toYear,
    salaryB: "",
  });
}

function SalaryRow({
  label,
  year,
  salary,
  onYear,
  onSalary,
  yearId,
  salaryId,
}: {
  label: string;
  year: number;
  salary: string;
  onYear: (y: number) => void;
  onSalary: (v: string) => void;
  yearId: string;
  salaryId: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="grid grid-cols-[6.5rem_1fr] gap-2 sm:grid-cols-[8rem_1fr] sm:gap-3">
        <select
          id={yearId}
          value={year}
          onChange={(e) => onYear(Number(e.target.value))}
          aria-label={`${label} year`}
          className="w-full rounded-xl border border-zinc-300 bg-white px-2 py-2.5 text-base font-medium tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="flex items-center rounded-xl border border-zinc-300 bg-zinc-50 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="text-lg font-semibold text-zinc-400">€</span>
          <input
            id={salaryId}
            type="text"
            inputMode="decimal"
            value={salary}
            onChange={(e) => onSalary(e.target.value)}
            placeholder="0"
            aria-label={`${label} amount`}
            className="w-full min-w-0 bg-transparent py-2.5 pl-2 text-lg font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
          <span className="pl-1 text-xs text-zinc-400">/mo</span>
        </div>
      </div>
    </div>
  );
}

export default function CostOfLiving() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        setState(normalizeState(JSON.parse(raw)));
      } else {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) setState(fromLegacy(JSON.parse(legacy)));
      }
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

  const { yearA, salaryA, yearB, salaryB } = state;
  const sA = useMemo(() => parseAmount(salaryA), [salaryA]);
  const sB = useMemo(() => parseAmount(salaryB), [salaryB]);

  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  // Always frame the comparison chronologically so the wording is never backwards.
  const sameYear = yearA === yearB;
  const aIsEarlier = yearA <= yearB;
  const baselineYear = aIsEarlier ? yearA : yearB;
  const nowYear = aIsEarlier ? yearB : yearA;
  const baselineSalary = aIsEarlier ? sA : sB;
  const nowSalary = aIsEarlier ? sB : sA;

  const hasBaseline = baselineSalary > 0;
  const hasNow = nowSalary > 0;

  // What the baseline salary would need to be in the later year to buy the same.
  const target = convert(baselineSalary, baselineYear, nowYear);
  const delta = nowSalary - target; // in today's (later-year) euros
  const pct = target > 0 ? delta / target : NaN;
  const rose = hasNow && delta > 0.5;
  const fell = hasNow && delta < -0.5;

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  const changeTone = rose
    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
    : fell
      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
  const changeAccent = rose
    ? "text-emerald-700 dark:text-emerald-400"
    : fell
      ? "text-amber-700 dark:text-amber-400"
      : "text-zinc-700 dark:text-zinc-200";

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Salary history
        </span>

        <div className="mt-4 space-y-4">
          <SalaryRow
            label="Earlier salary"
            year={yearA}
            salary={salaryA}
            onYear={(y) => set({ yearA: y })}
            onSalary={(v) => set({ salaryA: v })}
            yearId="col-year-a"
            salaryId="col-salary-a"
          />
          <SalaryRow
            label="Later salary"
            year={yearB}
            salary={salaryB}
            onYear={(y) => set({ yearB: y })}
            onSalary={(v) => set({ salaryB: v })}
            yearId="col-year-b"
            salaryId="col-salary-b"
          />
        </div>
      </div>

      {/* Result */}
      {sameYear ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Pick two different years to compare your salary across time.
        </div>
      ) : !hasBaseline ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
          Enter your {baselineYear} salary to compare buying power.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
          {/* Inflation-parity target */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            To keep the buying power of{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatEur(baselineSalary)}
            </span>{" "}
            from {baselineYear}, your {nowYear} salary should be
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-4xl">
              {formatEur(target)}
            </span>
            <span className="text-lg font-medium text-zinc-500">/ month</span>
          </div>

          {/* Real buying-power change vs the actual later salary */}
          {hasNow && (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${changeTone}`}>
              <div className="text-sm text-zinc-700 dark:text-zinc-200">
                Your buying power has{" "}
                <span className={`font-semibold ${changeAccent}`}>
                  {rose
                    ? `risen ${formatEur(delta)}/mo`
                    : fell
                      ? `fallen ${formatEur(-delta)}/mo`
                      : "held steady"}
                </span>{" "}
                since {baselineYear}.
              </div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {(rose || fell) && <>({formatPct(pct)} in today&apos;s money) · </>}
                your {nowYear} pay of {formatEur(nowSalary)} vs the{" "}
                {formatEur(target)} needed
              </div>
            </div>
          )}

          {/* Inflation context */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Cumulative inflation
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatPct(priceChange(baselineYear, nowYear))}
              </div>
              <div className="text-xs text-zinc-400">
                {baselineYear} → {nowYear}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Average per year
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatPct(annualInflation(baselineYear, nowYear))}
              </div>
              <div className="text-xs text-zinc-400">
                over {nowYear - baselineYear} years
              </div>
            </div>
          </div>

          <div className="mt-5">
            <PurchasingPowerChart
              baselineSalary={baselineSalary}
              baselineYear={baselineYear}
              nowYear={nowYear}
              actualNow={hasNow ? nowSalary : undefined}
            />
          </div>
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Based on Statistics Finland&apos;s cost-of-living index (1914:1–6 = 100),
        annual averages 1860–{MAX_YEAR}. Figures are adjusted purely for changes
        in the price level.
      </p>
    </div>
  );
}
