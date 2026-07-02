import { formatEur, formatPercent } from "@/lib/format";
import { SEGMENT_COLORS, type GrossAllocationSegment } from "@/lib/tax-bracket-visualizer";

type Props = {
  segments: GrossAllocationSegment[];
  activeSegment: GrossAllocationSegment | null;
};

const rateLabel = (ratePercent: number) =>
  formatPercent(ratePercent / 100, { maximumFractionDigits: 2, locale: "fi-FI" });

const emphasis = "font-semibold tabular-nums text-zinc-700 dark:text-zinc-200";

/** The detail line for one hovered/tapped segment. */
function segmentDetail(segment: GrossAllocationSegment) {
  switch (segment.kind) {
    case "contributions":
      return (
        <span>
          TyEL + unemployment, {rateLabel(segment.ratePercent ?? 0)} of gross ={" "}
          <span className={emphasis}>{formatEur(segment.amount)}</span>
        </span>
      );
    case "state":
      return (
        <span>
          <span className={emphasis}>{formatEur(segment.taxedBase ?? 0)}</span> of taxable
          income taxed at <span className={emphasis}>{rateLabel(segment.ratePercent ?? 0)}</span>{" "}
          = <span className={emphasis}>{formatEur(segment.amount)}</span> state tax
        </span>
      );
    case "municipal":
      return (
        <span>
          <span className={emphasis}>{formatEur(segment.taxedBase ?? 0)}</span> taxable ×{" "}
          <span className={emphasis}>{rateLabel(segment.ratePercent ?? 0)}</span> ={" "}
          <span className={emphasis}>{formatEur(segment.amount)}</span> municipal tax
        </span>
      );
    case "net":
      return (
        <span>
          You keep{" "}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatEur(segment.amount)}
          </span>{" "}
          — {formatPercent(segment.fraction)} of gross
        </span>
      );
  }
}

/** The line under the bar: a readout for the active segment, otherwise the legend. */
export default function BarCaption({ segments, activeSegment }: Props) {
  return (
    <div className="mt-2 flex min-h-10 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-xs text-zinc-500 dark:text-zinc-400">
      {activeSegment ? (
        segmentDetail(activeSegment)
      ) : (
        segments.map((segment) => (
          <span key={segment.id} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SEGMENT_COLORS[segment.id] }}
            />
            {segment.label}
          </span>
        ))
      )}
    </div>
  );
}
