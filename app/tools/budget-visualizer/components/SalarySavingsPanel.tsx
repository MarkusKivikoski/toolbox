import type { SavingsProjection } from "@/lib/budget";
import { formatDuration, formatEur, formatPercent } from "@/lib/format";
import { dateInMonths } from "../utils";
import {
  FINNISH_DURATION_UNITS,
  MIN_VISIBLE_PROGRESS_PCT,
  PERCENT_LOCALE,
} from "../constants";

type Props = {
  proj: SavingsProjection;
};

/** Salary-mode savings projection: the monthly leftover and time-to-goal. */
export default function SalarySavingsPanel({ proj }: Props) {
  return (
    <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Säästö kuukaudessa
          </div>
          <div className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatEur(proj.monthly)}
            <span className="text-base font-medium text-zinc-400"> /kk</span>
          </div>
          <div className="text-xs text-zinc-400">
            allokoimattomasta budjetista
          </div>
        </div>
        {proj.target > 0 && (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatEur(proj.balance)}{" "}
              <span className="font-normal text-zinc-400">
                / {formatEur(proj.target)}
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              {formatPercent(proj.progress, { locale: PERCENT_LOCALE })}{" "}
              säästetty
            </div>
          </div>
        )}
      </div>

      {proj.target > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${Math.max(
                proj.progress * 100,
                proj.progress > 0 ? MIN_VISIBLE_PROGRESS_PCT : 0,
              )}%`,
            }}
          />
        </div>
      )}

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        {proj.reached ? (
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            🎉 Olet saavuttanut säästötavoitteesi!
          </span>
        ) : proj.target <= 0 ? (
          <span className="text-zinc-500">
            Aseta tavoite nähdäksesi, kuinka kauan siihen menee.
          </span>
        ) : proj.monthsToTarget === null ? (
          <span className="text-amber-700 dark:text-amber-400">
            Säästettävää ei jää — karsi budjettia aloittaaksesi tavoitteen eteen
            säästämisen.
          </span>
        ) : (
          <span className="text-zinc-700 dark:text-zinc-200">
            Tavoite{" "}
            <span className="font-semibold">{formatEur(proj.target)}</span>{" "}
            täyttyy{" "}
            <span className="font-semibold">
              {formatDuration(proj.monthsToTarget / 12, FINNISH_DURATION_UNITS)}
            </span>{" "}
            kuluttua — noin{" "}
            <span className="font-semibold">
              {dateInMonths(proj.monthsToTarget)}
            </span>
            .
          </span>
        )}
      </div>
    </div>
  );
}
