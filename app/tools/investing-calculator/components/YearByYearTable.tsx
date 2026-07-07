import type { YearPoint } from "@/lib/investing";
import { formatEur, formatEurPrecise } from "@/lib/format";

type YearByYearTableProps = {
  points: YearPoint[];
  showTodaysMoney: boolean;
};

/** Collapsible per-year breakdown table. */
export default function YearByYearTable({
  points,
  showTodaysMoney,
}: YearByYearTableProps) {
  return (
    <details className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Year-by-year breakdown
      </summary>
      <div className="max-h-96 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-lg whitespace-nowrap text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-2 font-medium">Age</th>
              <th className="px-4 py-2 font-medium">Phase</th>
              <th className="px-4 py-2 text-right font-medium">Invested</th>
              <th className="px-4 py-2 text-right font-medium">Balance</th>
              {showTodaysMoney && (
                <th className="px-4 py-2 text-right font-medium">
                  Today&apos;s €
                </th>
              )}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {points.map((point) => (
              <tr
                key={point.year}
                className="border-t border-zinc-100 dark:border-zinc-800/60"
              >
                <td className="px-4 py-1.5">{point.age}</td>
                <td className="px-4 py-1.5">
                  <span
                    className={
                      point.stage === "retirement"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-500"
                    }
                  >
                    {point.stage === "retirement" ? "Retired" : "Saving"}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-right text-zinc-500">
                  {formatEur(point.contributed)}
                </td>
                <td className="px-4 py-1.5 text-right font-medium">
                  {formatEurPrecise(point.balance)}
                </td>
                {showTodaysMoney && (
                  <td className="px-4 py-1.5 text-right text-zinc-500">
                    {formatEur(point.realBalance)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
