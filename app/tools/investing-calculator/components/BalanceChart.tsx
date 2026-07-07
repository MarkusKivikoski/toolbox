"use client";

import { useEffect, useRef, useState } from "react";
import type { YearPoint } from "@/lib/investing";
import { compactEur, formatEur } from "@/lib/format";

type BalanceChartProps = {
  points: YearPoint[];
  accumulationYears: number;
  /** Show the inflation-adjusted ("today's money") line. */
  showTodaysMoney?: boolean;
};

// Layout breakpoints/sizes for the responsive SVG (measured px widths).
const NARROW_WIDTH_PX = 480;
const MEDIUM_WIDTH_PX = 768;
const NARROW_HEIGHT_PX = 230;
const MEDIUM_HEIGHT_PX = 290;
const WIDE_HEIGHT_PX = 330;
const HORIZONTAL_GRID_LINES = 4;

/** Round up to a "nice" axis maximum: 1/2/5 × a power of ten. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const powerOfTen = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / powerOfTen;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * powerOfTen;
}

export default function BalanceChart({
  points,
  accumulationYears,
  showTodaysMoney = false,
}: BalanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Render at the container's real pixel width so text stays crisp on any device.
  const [width, setWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(Math.round(entry.contentRect.width));
    });
    resizeObserver.observe(container);
    setWidth(Math.round(container.clientWidth));
    return () => resizeObserver.disconnect();
  }, []);

  const isNarrow = width > 0 && width < NARROW_WIDTH_PX;
  const height =
    width < NARROW_WIDTH_PX
      ? NARROW_HEIGHT_PX
      : width < MEDIUM_WIDTH_PX
        ? MEDIUM_HEIGHT_PX
        : WIDE_HEIGHT_PX;
  const padding = {
    top: 18,
    right: 14,
    bottom: 28,
    left: isNarrow ? 44 : 56,
  };

  const lastYear = points[points.length - 1]?.year ?? 0;
  const maxYear = Math.max(1, lastYear);
  const rawMax = Math.max(
    1,
    ...points.map((point) => Math.max(point.balance, point.contributed))
  );
  const maxValue = niceCeil(rawMax);

  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = Math.max(1, height - padding.top - padding.bottom);

  const xOf = (year: number) => padding.left + (year / maxYear) * plotWidth;
  const yOf = (value: number) =>
    padding.top + plotHeight - (value / maxValue) * plotHeight;

  const balanceLine = points.map(
    (point) => `${xOf(point.year)},${yOf(point.balance)}`
  );
  const balanceArea =
    `${xOf(0)},${yOf(0)} ` + balanceLine.join(" ") + ` ${xOf(maxYear)},${yOf(0)}`;
  const contributedLine = points
    .map((point) => `${xOf(point.year)},${yOf(point.contributed)}`)
    .join(" ");
  const todaysMoneyLine = points
    .map((point) => `${xOf(point.year)},${yOf(point.realBalance)}`)
    .join(" ");

  const gridValues = Array.from(
    { length: HORIZONTAL_GRID_LINES + 1 },
    (_, index) => (maxValue / HORIZONTAL_GRID_LINES) * index
  );

  const targetTickCount = width < 420 ? 4 : width < 700 ? 6 : 8;
  const tickStep = Math.max(1, Math.round(maxYear / targetTickCount));
  const tickYears: number[] = [];
  for (let year = 0; year <= maxYear; year += tickStep) tickYears.push(year);
  if (tickYears[tickYears.length - 1] !== maxYear) tickYears.push(maxYear);

  const currentAge = points[0]?.age ?? 0;
  const retirementX = xOf(accumulationYears);
  const showRetirementMarker =
    accumulationYears > 0 && accumulationYears < maxYear;

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const localX = (clientX - rect.left) * (width / Math.max(1, rect.width));
    const yearGuess = ((localX - padding.left) / plotWidth) * maxYear;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    for (let index = 0; index < points.length; index++) {
      const distance = Math.abs(points[index].year - yearGuess);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
    setHoveredIndex(nearestIndex);
  }

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: NARROW_HEIGHT_PX }}>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block touch-pan-y select-none"
          role="img"
          aria-label="Balance over time"
          onPointerDown={(event) => pointerToIndex(event.clientX)}
          onPointerMove={(event) => {
            if (
              event.pointerType === "mouse" ||
              event.buttons > 0 ||
              event.pressure > 0
            )
              pointerToIndex(event.clientX);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setHoveredIndex(null);
          }}
        >
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="transparent" />

          {gridValues.map((gridValue, index) => (
            <g key={`grid-${index}`}>
              <line
                x1={padding.left}
                y1={yOf(gridValue)}
                x2={width - padding.right}
                y2={yOf(gridValue)}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={padding.left - 6}
                y={yOf(gridValue) + 4}
                textAnchor="end"
                className="fill-zinc-400 text-[11px]"
              >
                {compactEur(gridValue)}
              </text>
            </g>
          ))}

          {tickYears.map((tickYear, index) => (
            <text
              key={`tick-${index}`}
              x={xOf(tickYear)}
              y={height - padding.bottom + 17}
              textAnchor="middle"
              className="fill-zinc-400 text-[11px]"
            >
              {currentAge + tickYear}
            </text>
          ))}

          {showRetirementMarker && (
            <g>
              <line
                x1={retirementX}
                y1={padding.top}
                x2={retirementX}
                y2={padding.top + plotHeight}
                className="stroke-amber-400/80"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={retirementX + 4}
                y={padding.top + 11}
                className="fill-amber-500 text-[10px] font-medium"
              >
                Retire {currentAge + accumulationYears}
              </text>
            </g>
          )}

          <polygon points={balanceArea} fill="url(#balanceFill)" />
          <polyline
            points={balanceLine.join(" ")}
            fill="none"
            className="stroke-emerald-500"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {showTodaysMoney && (
            <polyline
              points={todaysMoneyLine}
              fill="none"
              className="stroke-violet-500"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          <polyline
            points={contributedLine}
            fill="none"
            className="stroke-zinc-400 dark:stroke-zinc-500"
            strokeWidth={1.75}
            strokeDasharray="5 4"
          />

          {hoveredPoint && (
            <g>
              <line
                x1={xOf(hoveredPoint.year)}
                y1={padding.top}
                x2={xOf(hoveredPoint.year)}
                y2={padding.top + plotHeight}
                className="stroke-zinc-300 dark:stroke-zinc-600"
                strokeWidth={1}
              />
              <circle
                cx={xOf(hoveredPoint.year)}
                cy={yOf(hoveredPoint.contributed)}
                r={3.5}
                className="fill-zinc-400"
              />
              {showTodaysMoney && (
                <circle
                  cx={xOf(hoveredPoint.year)}
                  cy={yOf(hoveredPoint.realBalance)}
                  r={3.5}
                  className="fill-violet-500"
                />
              )}
              <circle
                cx={xOf(hoveredPoint.year)}
                cy={yOf(hoveredPoint.balance)}
                r={4.5}
                className="fill-emerald-500 stroke-white dark:stroke-zinc-900"
                strokeWidth={1.5}
              />
            </g>
          )}
        </svg>
      )}

      {/* Legend + readout */}
      <div className="mt-2 flex flex-col gap-2 px-1 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Balance
          </span>
          {showTodaysMoney && (
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-violet-500" />
              Today&apos;s money
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-zinc-400" />
            Invested
          </span>
        </div>
        {hoveredPoint ? (
          <div className="text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">Age {hoveredPoint.age}</span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatEur(hoveredPoint.balance)}
            </span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {formatEur(hoveredPoint.contributed)} invested
            </span>
            {showTodaysMoney && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-violet-600 dark:text-violet-400">
                  {formatEur(hoveredPoint.realBalance)} today
                </span>
              </>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">Tap or hover the chart for values</span>
        )}
      </div>
    </div>
  );
}
