import { formatEur } from "@/lib/format";

type Props = {
  activeYear: number | null;
  /** Parity euros for the active year; paired with `activeYear`. */
  activeValue: number | null;
  target: number;
  nowYear: number;
  actualNow?: number;
  actualBelow: boolean;
};

/** The line under the chart: a hover readout when active, otherwise the legend. */
export default function ChartCaption({
  activeYear,
  activeValue,
  target,
  nowYear,
  actualNow,
  actualBelow,
}: Props) {
  return (
    <div className="mt-1 flex min-h-[1.25rem] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-xs text-zinc-500 dark:text-zinc-400">
      {activeYear !== null && activeValue !== null ? (
        <span>
          In{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {activeYear}
          </span>{" "}
          you&apos;d need{" "}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatEur(activeValue)}
          </span>{" "}
          for the same buying power
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-emerald-500" />
            parity (needs {formatEur(target)} in {nowYear})
          </span>
          {actualNow !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  actualBelow ? "bg-amber-500" : "bg-emerald-600"
                }`}
              />
              your actual {formatEur(actualNow)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
