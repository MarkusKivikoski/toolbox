import type { ContributionPhase } from "@/lib/investing";
import NumberField from "./NumberField";

type PhasesEditorProps = {
  phases: ContributionPhase[];
  currentAge: number;
  retirementAge: number;
  accumulationYears: number;
  /** Years the final ("until retirement") phase actually covers. */
  lastPhaseYears: number;
  /** True when earlier phases already overrun the time to retirement. */
  hasPhaseOverflow: boolean;
  onUpdatePhase: (id: string, patch: Partial<ContributionPhase>) => void;
  onAddPhase: () => void;
  onRemovePhase: (id: string) => void;
};

/** The contribution-phase list: per-phase fields, overflow warning, add button. */
export default function PhasesEditor({
  phases,
  currentAge,
  retirementAge,
  accumulationYears,
  lastPhaseYears,
  hasPhaseOverflow,
  onUpdatePhase,
  onAddPhase,
  onRemovePhase,
}: PhasesEditorProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Monthly contributions
        </h3>
        <span className="text-xs text-zinc-400">
          age {currentAge}→{retirementAge} · {accumulationYears} yr
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-400">
        Add a phase whenever your monthly amount changes (e.g. after a pay
        raise). The last phase runs until retirement.
      </p>

      <div className="space-y-2.5">
        {phases.map((phase, index) => {
          const isLastPhase = index === phases.length - 1;
          return (
            <div
              key={phase.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Phase {index + 1}
                </span>
                {phases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemovePhase(phase.id)}
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
                  onChange={(monthlyContribution) =>
                    onUpdatePhase(phase.id, { monthlyContribution })
                  }
                  prefix="€"
                />
                {isLastPhase ? (
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
                    onChange={(years) =>
                      onUpdatePhase(phase.id, { years: Math.round(years) })
                    }
                    suffix="yr"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasPhaseOverflow && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Your phases run longer than the time to retirement — later
          contributions are ignored.
        </p>
      )}

      <button
        type="button"
        onClick={onAddPhase}
        className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-emerald-400"
      >
        + Add contribution phase
      </button>
    </div>
  );
}
