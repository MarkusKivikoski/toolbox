"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateProjection,
  normalizeInput,
  type ContributionPhase,
  type InvestingInput,
} from "@/lib/investing";
import { formatEur, formatEur2, formatDuration } from "@/lib/format";
import { toCsv } from "@/lib/exportCsv";
import { toXlsxBlob } from "@/lib/exportXlsx";
import { download } from "@/lib/download";
import BalanceChart from "@/components/BalanceChart";
import SavedCalculations from "@/components/SavedCalculations";

const STORAGE_KEY = "toolbox.investing-calculator.v1";

let phaseSeq = 0;
const newPhaseId = () => `phase-${++phaseSeq}-${Date.now()}`;

// Defaults model the example: 10k start at age 30, 100€/mo at first, 250€/mo
// after a year, then 400€/mo after a pay raise until retiring at 60 — then
// living off it to age 90.
const DEFAULT_INPUT: InvestingInput = {
  startingBalance: 10000,
  annualReturnPct: 7,
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 90,
  phases: [
    { id: "phase-a", years: 1, monthlyContribution: 100 },
    { id: "phase-b", years: 4, monthlyContribution: 250 },
    { id: "phase-c", years: 25, monthlyContribution: 400 },
  ],
  retirement: {
    enabled: true,
    mode: "fixed",
    basis: "net",
    monthlyWithdrawal: 2500,
    annualReturnPct: 5,
    capitalGainsTaxPct: 30,
    usePresumedCost: true,
    kansanelake: 0,
    kansanelakeTaxPct: 0,
    kansanelakeStartAge: 65,
  },
  inflationPct: 0,
};

// A clean slate for "New calculation".
const BLANK_INPUT: InvestingInput = {
  startingBalance: 0,
  annualReturnPct: 7,
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 90,
  phases: [{ id: "phase-new", years: 10, monthlyContribution: 100 }],
  retirement: {
    enabled: false,
    mode: "fixed",
    basis: "net",
    monthlyWithdrawal: 1500,
    annualReturnPct: 4,
    capitalGainsTaxPct: 30,
    usePresumedCost: true,
    kansanelake: 0,
    kansanelakeTaxPct: 0,
    kansanelakeStartAge: 65,
  },
  inflationPct: 0,
};

/** Text input that round-trips through a number while letting you type
 *  intermediate values like "7." or a comma decimal separator. */
function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  hintTone = "muted",
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  hintTone?: "muted" | "warn";
  min?: number;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));

  useEffect(() => {
    const parsed = parseFloat(text.replace(",", "."));
    const current = Number.isFinite(parsed) ? parsed : 0;
    if (current !== value) setText(value === 0 ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const parsed = parseFloat(raw.replace(",", "."));
            const n = Number.isFinite(parsed) ? parsed : 0;
            onChange(min !== undefined ? Math.max(min, n) : n);
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

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "zinc" | "amber";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

export default function InvestingCalculator() {
  const [input, setInput] = useState<InvestingInput>(DEFAULT_INPUT);

  // Restore previous session.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(normalizeInput(JSON.parse(saved)));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* storage may be unavailable */
    }
  }, [input]);

  const result = useMemo(() => calculateProjection(input), [input]);
  const showReal = input.inflationPct > 0;

  // ---- mutation helpers ----
  const set = <K extends keyof InvestingInput>(key: K, value: InvestingInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const setRetirement = (patch: Partial<InvestingInput["retirement"]>) =>
    setInput((prev) => ({ ...prev, retirement: { ...prev.retirement, ...patch } }));

  const updatePhase = (id: string, patch: Partial<ContributionPhase>) =>
    setInput((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const addPhase = () =>
    setInput((prev) => {
      const last = prev.phases[prev.phases.length - 1];
      // The current last phase becomes finite; the new one runs to retirement.
      const finite = prev.phases.map((p, idx) =>
        idx === prev.phases.length - 1
          ? { ...p, years: p.years > 0 ? p.years : 5 }
          : p
      );
      return {
        ...prev,
        phases: [
          ...finite,
          {
            id: newPhaseId(),
            years: 5,
            monthlyContribution: last ? last.monthlyContribution : 100,
          },
        ],
      };
    });

  const removePhase = (id: string) =>
    setInput((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p.id !== id),
    }));

  const reset = () => setInput(DEFAULT_INPUT);

  // ---- spreadsheet export ----
  const [exporting, setExporting] = useState(false);
  const exportName = `investing-calculator-${new Date().toISOString().slice(0, 10)}`;

  const exportCsv = () =>
    download(`${exportName}.csv`, "text/csv;charset=utf-8", toCsv(result, input));

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const blob = await toXlsxBlob(result, input);
      download(`${exportName}.xlsx`, blob.type, blob);
    } finally {
      setExporting(false);
    }
  };

  const lasts = result.depletionYear === null;
  const spendDown = result.withdrawalMode === "spendDown";
  const isNet = result.withdrawalBasis === "net";
  const hasPension = input.retirement.kansanelake > 0;
  const pensionActiveAtStart =
    hasPension && input.retirement.kansanelakeStartAge <= input.retirementAge;
  // When retiring before the pension starts, show a separate combined-income box.
  const showTotalIncomeTile =
    hasPension &&
    !pensionActiveAtStart &&
    input.retirement.kansanelakeStartAge < input.lifeExpectancy;
  // depletionYear is measured from today (year 0); convert to "into retirement".
  const depletionIntoRetirement =
    result.depletionYear === null
      ? 0
      : Math.max(0, result.depletionYear - result.accumulationYears);

  // How long the final ("until retirement") phase actually covers, and whether
  // the earlier phases already overrun the time to retirement.
  const nonLastYears = input.phases
    .slice(0, -1)
    .reduce((sum, p) => sum + Math.max(0, Math.round(p.years)), 0);
  const lastPhaseYears = Math.max(0, result.accumulationYears - nonLastYears);
  const phasesOverflow = nonLastYears > result.accumulationYears;
  const retirementAgeInvalid = result.retirementAge <= result.currentAge;
  const lifeExpectancyInvalid =
    result.lifeExpectancy <= result.retirementAge;

  return (
    <div className="space-y-6">
      <SavedCalculations
        current={input}
        onLoad={(loaded) => setInput(normalizeInput(loaded))}
        defaultInput={BLANK_INPUT}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ---------- Form ---------- */}
        <section className="lg:col-span-5">
        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Starting balance"
              value={input.startingBalance}
              onChange={(n) => set("startingBalance", n)}
              prefix="€"
            />
            <NumberField
              label="Expected yearly return"
              value={input.annualReturnPct}
              onChange={(n) => set("annualReturnPct", n)}
              suffix="%"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Current age"
              value={input.currentAge}
              onChange={(n) => set("currentAge", Math.round(n))}
            />
            <NumberField
              label="Retirement age"
              value={input.retirementAge}
              onChange={(n) => set("retirementAge", Math.round(n))}
              hint={retirementAgeInvalid ? "Set above current age" : undefined}
              hintTone="warn"
            />
          </div>

          {/* Contribution phases */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Monthly contributions
              </h3>
              <span className="text-xs text-zinc-400">
                age {result.currentAge}→{result.retirementAge} ·{" "}
                {result.accumulationYears} yr
              </span>
            </div>
            <p className="mb-3 text-xs text-zinc-400">
              Add a phase whenever your monthly amount changes (e.g. after a pay
              raise). The last phase runs until retirement.
            </p>

            <div className="space-y-2.5">
              {input.phases.map((phase, i) => (
                <div
                  key={phase.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      Phase {i + 1}
                    </span>
                    {input.phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhase(phase.id)}
                        className="-mr-1 rounded px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Per month"
                      value={phase.monthlyContribution}
                      onChange={(n) =>
                        updatePhase(phase.id, { monthlyContribution: n })
                      }
                      prefix="€"
                    />
                    {i === input.phases.length - 1 ? (
                      <div>
                        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Duration
                        </span>
                        <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-700 sm:py-2">
                          Until retirement · {lastPhaseYears} yr
                        </div>
                      </div>
                    ) : (
                      <NumberField
                        label="For (years)"
                        value={phase.years}
                        onChange={(n) =>
                          updatePhase(phase.id, { years: Math.round(n) })
                        }
                        suffix="yr"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {phasesOverflow && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Your phases run longer than the time to retirement — later
                contributions are ignored.
              </p>
            )}

            <button
              type="button"
              onClick={addPhase}
              className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              + Add contribution phase
            </button>
          </div>

          {/* Retirement */}
          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Model retirement drawdown
              </span>
              <input
                type="checkbox"
                checked={input.retirement.enabled}
                onChange={(e) => setRetirement({ enabled: e.target.checked })}
                className="h-5 w-5 flex-shrink-0 accent-emerald-500"
              />
            </label>

            {input.retirement.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      How to withdraw
                    </span>
                    <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800/60">
                      {(["fixed", "spendDown"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRetirement({ mode: m })}
                          className={`rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${
                            input.retirement.mode === m
                              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {m === "fixed" ? "Fixed amount" : "Spend it all"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Amount basis
                    </span>
                    <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800/60">
                      {(["net", "gross"] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setRetirement({ basis: b })}
                          className={`rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${
                            input.retirement.basis === b
                              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {b === "net" ? "Net (after tax)" : "Gross (pre-tax)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {input.retirement.mode === "fixed" ? (
                    <NumberField
                      label={isNet ? "Spend / month (net)" : "Sell / month (gross)"}
                      value={input.retirement.monthlyWithdrawal}
                      onChange={(n) => setRetirement({ monthlyWithdrawal: n })}
                      prefix="€"
                    />
                  ) : (
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        You can {isNet ? "spend" : "sell"}
                      </span>
                      <div className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 sm:py-2">
                        ≈ {formatEur(isNet ? result.firstMonthlyNet : result.firstMonthlyGross)}/mo {isNet ? "net" : "gross"}
                      </div>
                      <span className="mt-1 block text-xs text-zinc-400">
                        {isNet
                          ? `selling ≈ ${formatEur(result.firstMonthlyGross)} gross`
                          : `≈ ${formatEur(result.firstMonthlyNet)} net after tax`}
                        {input.inflationPct > 0 ? ", rising with inflation" : ""}
                      </span>
                    </div>
                  )}
                  <NumberField
                    label="Life expectancy"
                    value={input.lifeExpectancy}
                    onChange={(n) => set("lifeExpectancy", Math.round(n))}
                    hint={
                      lifeExpectancyInvalid
                        ? "Set above retirement age"
                        : `Drawdown lasts ${result.retirementYears} yr`
                    }
                    hintTone={lifeExpectancyInvalid ? "warn" : "muted"}
                  />
                  <NumberField
                    label="Return while retired"
                    value={input.retirement.annualReturnPct}
                    onChange={(n) => setRetirement({ annualReturnPct: n })}
                    suffix="%"
                    hint="Often lower / safer than while saving."
                  />
                  <NumberField
                    label="Capital gains tax"
                    value={input.retirement.capitalGainsTaxPct}
                    onChange={(n) => setRetirement({ capitalGainsTaxPct: n })}
                    suffix="%"
                    hint="Finland: 30%"
                  />
                </div>

                <label className="flex cursor-pointer items-start justify-between gap-3 py-1">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Apply hankintameno-olettama
                    <span className="mt-0.5 block text-xs text-zinc-400">
                      Finnish presumed acquisition cost — taxes at most 60% of a
                      sale (assumes holdings of 10+ years).
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={input.retirement.usePresumedCost}
                    onChange={(e) =>
                      setRetirement({ usePresumedCost: e.target.checked })
                    }
                    className="mt-0.5 h-5 w-5 flex-shrink-0 accent-emerald-500"
                  />
                </label>

                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Kansaneläke (state pension)
                  </div>
                  <p className="mb-3 mt-0.5 text-xs text-zinc-400">
                    Optional — added on top of your withdrawals as income. Rises
                    with inflation.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <NumberField
                      label="Kansaneläke / month"
                      value={input.retirement.kansanelake}
                      onChange={(n) => setRetirement({ kansanelake: n })}
                      prefix="€"
                      hint="0 = none"
                    />
                    {input.retirement.kansanelake > 0 && (
                      <>
                        <NumberField
                          label="Pension tax"
                          value={input.retirement.kansanelakeTaxPct}
                          onChange={(n) =>
                            setRetirement({ kansanelakeTaxPct: n })
                          }
                          suffix="%"
                        />
                        <NumberField
                          label="Pension starts at age"
                          value={input.retirement.kansanelakeStartAge}
                          onChange={(n) =>
                            setRetirement({
                              kansanelakeStartAge: Math.round(n),
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced */}
          <details className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Advanced
            </summary>
            <div className="mt-3">
              <NumberField
                label="Inflation"
                value={input.inflationPct}
                onChange={(n) => set("inflationPct", n)}
                suffix="%"
                hint="If set, also shows values in today's money."
              />
            </div>
          </details>

          <button
            type="button"
            onClick={reset}
            className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
          >
            Reset to example
          </button>
        </div>
      </section>

      {/* ---------- Results ---------- */}
      <section className="space-y-5 lg:col-span-7">
        {/* Headline */}
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-900">
          <div className="text-sm font-medium text-zinc-500">
            Projected balance at retirement · age {result.retirementAge}
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums break-words text-emerald-600 dark:text-emerald-400 sm:text-4xl">
            {formatEur(result.endOfAccumulationBalance)}
          </div>
          {showReal && (
            <div className="mt-1 text-sm text-zinc-500">
              ≈ {formatEur(result.endOfAccumulationBalance / Math.pow(1 + input.inflationPct / 100, result.accumulationYears))}{" "}
              in today&apos;s money
            </div>
          )}
        </div>

        {/* Accumulation stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Starting balance"
            value={formatEur(result.startingBalance)}
          />
          <StatTile
            label="You invested"
            value={formatEur(result.totalContributions)}
            sub={`age ${result.currentAge} → ${result.retirementAge}`}
          />
          <StatTile
            label="Investment growth"
            value={formatEur(result.accumulationGrowth)}
            accent="emerald"
            sub="compounded returns"
          />
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <BalanceChart
            points={result.points}
            accumulationYears={result.accumulationYears}
            showReal={showReal}
          />
        </div>

        {/* Retirement */}
        {input.retirement.enabled && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Retirement drawdown
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {spendDown ? (
                <>
                  Spending down to ≈€0 by age {result.lifeExpectancy} — you can{" "}
                  {isNet ? "spend" : "sell"} ≈
                  {formatEur(
                    isNet ? result.firstMonthlyNet : result.firstMonthlyGross
                  )}
                  /mo {isNet ? "net" : "gross"}
                  {input.inflationPct > 0 ? " (rising with inflation)" : ""} from
                  age {result.retirementAge} at {input.retirement.annualReturnPct}
                  %.
                </>
              ) : (
                <>
                  {isNet ? "Living on" : "Selling"}{" "}
                  {formatEur(input.retirement.monthlyWithdrawal)}/month{" "}
                  {isNet ? "net" : "gross"} from age {result.retirementAge} to{" "}
                  {result.lifeExpectancy} — {result.retirementYears} years at{" "}
                  {input.retirement.annualReturnPct}%.
                </>
              )}
            </p>

            <div
              className={`mt-4 grid grid-cols-1 gap-3 ${
                showTotalIncomeTile ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
            >
              <StatTile
                label="Monthly income (net)"
                value={`≈ ${formatEur(
                  hasPension ? result.firstMonthlyTotalNet : result.firstMonthlyNet
                )}`}
                accent="emerald"
                sub={
                  hasPension
                    ? pensionActiveAtStart
                      ? `${formatEur(result.firstMonthlyNet)} invest + ${formatEur(result.pensionNetMonthly)} pension`
                      : `${formatEur(result.firstMonthlyNet)} invest · +${formatEur(result.pensionNetMonthly)} pension from age ${result.pensionStartAge}`
                    : input.inflationPct > 0
                      ? `→ ${formatEur(result.lastMonthlyNet)} at age ${result.lifeExpectancy}`
                      : "after tax"
                }
              />
              {showTotalIncomeTile && (
                <StatTile
                  label="Total income (with pension)"
                  value={`≈ ${formatEur(result.monthlyTotalIncomeWithPension)}`}
                  accent="emerald"
                  sub={`from age ${result.pensionStartAge} · ${formatEur(
                    result.monthlyTotalIncomeWithPension - result.pensionNetMonthly
                  )} invest + ${formatEur(result.pensionNetMonthly)} pension`}
                />
              )}
              <StatTile
                label="Capital gains tax"
                value={formatEur(result.totalTax)}
                accent="amber"
                sub={
                  result.totalWithdrawn > 0
                    ? `≈ ${Math.round(
                        (result.totalTax / result.totalWithdrawn) * 100
                      )}% of sales`
                    : "over retirement"
                }
              />
              {spendDown ? (
                <StatTile
                  label="Lifetime spending"
                  value={formatEur(result.totalNet)}
                  sub="net, after tax"
                />
              ) : (
                <StatTile
                  label={lasts ? "Balance remaining" : "Runs out at"}
                  value={
                    lasts
                      ? formatEur(result.finalBalance)
                      : `age ${Math.floor(result.depletionAge ?? 0)}`
                  }
                  accent={lasts ? "emerald" : "amber"}
                  sub={
                    lasts
                      ? `at age ${result.lifeExpectancy}`
                      : `${formatDuration(depletionIntoRetirement)} into retirement`
                  }
                />
              )}
            </div>

            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                spendDown || lasts
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {spendDown ? (
                <>
                  This is the most you can {isNet ? "spend" : "sell"} while still
                  reaching age {result.lifeExpectancy} — the pot runs down to ≈€0
                  at the end, after ≈{formatEur(result.totalTax)} of capital-gains
                  tax
                  {input.inflationPct > 0
                    ? " and with spending keeping pace with inflation."
                    : "."}
                </>
              ) : lasts ? (
                <>
                  Your money lasts to age {result.lifeExpectancy}
                  {result.finalBalance > 0 && (
                    <>
                      {" "}
                      — with {formatEur(result.finalBalance)} still invested at
                      the end.
                    </>
                  )}
                </>
              ) : (
                <>
                  ⚠ The balance runs out around age{" "}
                  {Math.floor(result.depletionAge ?? 0)} — about{" "}
                  {formatDuration(depletionIntoRetirement)} into retirement. Try
                  lowering the withdrawal, retiring later, or saving more.
                </>
              )}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Export projection
            </div>
            <div className="text-xs text-zinc-400">
              Inputs, summary and year-by-year — for Excel / LibreOffice.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportXlsx}
              disabled={exporting}
              className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
            >
              {exporting ? "Generating…" : "Excel (.xlsx)"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Year-by-year table */}
        <details className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Year-by-year breakdown
          </summary>
          <div className="max-h-96 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[32rem] whitespace-nowrap text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950">
                <tr>
                  <th className="px-4 py-2 font-medium">Age</th>
                  <th className="px-4 py-2 font-medium">Phase</th>
                  <th className="px-4 py-2 text-right font-medium">Invested</th>
                  <th className="px-4 py-2 text-right font-medium">Balance</th>
                  {showReal && (
                    <th className="px-4 py-2 text-right font-medium">
                      Today&apos;s €
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {result.points.map((p) => (
                  <tr
                    key={p.year}
                    className="border-t border-zinc-100 dark:border-zinc-800/60"
                  >
                    <td className="px-4 py-1.5">{p.age}</td>
                    <td className="px-4 py-1.5">
                      <span
                        className={
                          p.stage === "retirement"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-500"
                        }
                      >
                        {p.stage === "retirement" ? "Retired" : "Saving"}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-right text-zinc-500">
                      {formatEur(p.contributed)}
                    </td>
                    <td className="px-4 py-1.5 text-right font-medium">
                      {formatEur2(p.balance)}
                    </td>
                    {showReal && (
                      <td className="px-4 py-1.5 text-right text-zinc-500">
                        {formatEur(p.realBalance)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        </section>
      </div>
    </div>
  );
}
