"use client";

import type { BudgetSlice } from "@/lib/budget";
import { formatEur, formatPercent } from "@/lib/format";

type Props = {
  slices: BudgetSlice[];
  /** The figure shown in the hole — the sum of the sections, leftover excluded. */
  allocated: number;
  /** Tints the total red when sections exceed the income. */
  overBudget: boolean;
  /** Label above the total in the hole. */
  totalLabel?: string;
  /** Caption below the total in the hole. */
  subLabel?: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

const SIZE = 240;
const C = SIZE / 2; // centre
const R = 84; // mid radius of the ring
const THICK = 34; // ring thickness
const POP = 7; // extra thickness when a slice is highlighted
/** Normalised circumference each slice's dasharray is measured against. */
const PATH_LENGTH = 100;
/** A sliver of dash so a near-zero slice still renders as a hairline. */
const MIN_DASH_LENGTH = 0.001;
/** Truncate the centre label past this many characters so it fits the hole. */
const MAX_CENTER_LABEL_LENGTH = 22;

/** The centre label shows finer-grained shares than the legend, hence 1 digit. */
const CENTER_PERCENT_DIGITS = 1;

/**
 * A dependency-free doughnut. Each slice is a stroked circle sized with
 * `stroke-dasharray` against a normalised path length, rotated so the first
 * slice starts at twelve o'clock. The hole shows the total, or the focused
 * slice's detail while hovering / tapping.
 */
export default function BudgetDoughnut({
  slices,
  allocated,
  overBudget,
  totalLabel = "Budgeted / month",
  subLabel = "across all sections",
  activeId,
  onActiveChange,
}: Props) {
  const drawn = slices.filter((slice) => slice.fraction > 0);
  const active = drawn.find((slice) => slice.id === activeId) ?? null;

  // Lay slices edge to edge around the ring, with no gaps between them.
  const starts = drawn.reduce<number[]>((acc, _, index) => {
    const prev = index === 0 ? 0 : acc[index - 1] + drawn[index - 1].fraction;
    return [...acc, prev];
  }, []);
  const segments = drawn.map((slice, index) => {
    const len = Math.max(slice.fraction * PATH_LENGTH, MIN_DASH_LENGTH);
    return {
      slice,
      dash: `${len} ${PATH_LENGTH - len}`,
      offset: -starts[index] * PATH_LENGTH,
    };
  });

  const renderRing = (
    seg: (typeof segments)[number],
    highlighted: boolean,
  ) => {
    const { slice } = seg;
    const themed = slice.color === null;
    return (
      <circle
        key={slice.id}
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke={themed ? undefined : slice.color ?? undefined}
        className={`cursor-pointer transition-[stroke-width] ${
          themed ? "stroke-zinc-200 dark:stroke-zinc-700" : ""
        }`}
        strokeWidth={highlighted ? THICK + POP : THICK}
        strokeDasharray={seg.dash}
        strokeDashoffset={seg.offset}
        pathLength={PATH_LENGTH}
        strokeLinecap="butt"
        onMouseEnter={() => onActiveChange(slice.id)}
        onMouseLeave={() => onActiveChange(null)}
        onClick={() => onActiveChange(active?.id === slice.id ? null : slice.id)}
      />
    );
  };

  const centerLabel = active ? active.name : totalLabel;
  const centerValue = active ? active.amount : allocated;
  const centerSub = active
    ? formatPercent(active.fraction, { maximumFractionDigits: CENTER_PERCENT_DIGITS })
    : subLabel;

  // Focused slice reads neutral; the standing total is green within income, red over it.
  const centerValueClass = active
    ? "fill-zinc-900 dark:fill-zinc-50"
    : overBudget
      ? "fill-rose-600 dark:fill-rose-400"
      : "fill-emerald-600 dark:fill-emerald-400";

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 300 }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label="Budget breakdown doughnut"
      >
        {/* Track behind the slices so the ring always reads as a full circle. */}
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={THICK}
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />

        <g transform={`rotate(-90 ${C} ${C})`}>
          {segments.map((seg) => renderRing(seg, false))}
          {/* Re-draw the focused slice on top, popped out. */}
          {active &&
            renderRing(
              segments.find((seg) => seg.slice.id === active.id)!,
              true,
            )}
        </g>

        {/* Hole content. */}
        <text
          x={C}
          y={C - 22}
          textAnchor="middle"
          className="fill-zinc-400 text-[12px]"
        >
          {centerLabel.length > MAX_CENTER_LABEL_LENGTH
            ? `${centerLabel.slice(0, MAX_CENTER_LABEL_LENGTH - 1)}…`
            : centerLabel}
        </text>
        <text
          x={C}
          y={C + 8}
          textAnchor="middle"
          className={`text-[26px] font-bold tabular-nums ${centerValueClass}`}
        >
          {formatEur(centerValue)}
        </text>
        <text
          x={C}
          y={C + 28}
          textAnchor="middle"
          className="fill-zinc-400 text-[12px] tabular-nums"
        >
          {centerSub}
        </text>
      </svg>
    </div>
  );
}
