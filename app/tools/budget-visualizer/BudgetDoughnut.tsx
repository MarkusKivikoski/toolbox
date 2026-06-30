"use client";

import type { BudgetSlice } from "@/lib/budget";
import { formatEur } from "@/lib/format";

type Props = {
  slices: BudgetSlice[];
  /** The figure shown in the hole — the sum of the sections, leftover excluded. */
  allocated: number;
  /** Tints the total red when sections exceed the income. */
  overBudget: boolean;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

const SIZE = 240;
const C = SIZE / 2; // centre
const R = 84; // mid radius of the ring
const THICK = 34; // ring thickness
const POP = 7; // extra thickness when a slice is highlighted

const pctFmt = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

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
  activeId,
  onActiveChange,
}: Props) {
  const drawn = slices.filter((s) => s.fraction > 0);
  const active = drawn.find((s) => s.id === activeId) ?? null;

  // Lay slices edge to edge around the ring, with no gaps between them.
  let cursor = 0;
  const segments = drawn.map((s) => {
    const start = cursor;
    cursor += s.fraction;
    const len = Math.max(s.fraction * 100, 0.001);
    return {
      slice: s,
      dash: `${len} ${100 - len}`,
      offset: -start * 100,
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
        pathLength={100}
        strokeLinecap="butt"
        onMouseEnter={() => onActiveChange(slice.id)}
        onMouseLeave={() => onActiveChange(null)}
        onClick={() => onActiveChange(active?.id === slice.id ? null : slice.id)}
      />
    );
  };

  const centerLabel = active ? active.name : "Budgeted / month";
  const centerValue = active ? active.amount : allocated;
  const centerSub = active
    ? pctFmt.format(active.fraction)
    : "across all sections";

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
              segments.find((s) => s.slice.id === active.id)!,
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
          {centerLabel.length > 22
            ? `${centerLabel.slice(0, 21)}…`
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
