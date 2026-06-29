"use client";

import { useEffect, useRef, useState } from "react";
import { convert } from "@/lib/cost-of-living";
import { compactEur, formatEur } from "@/lib/format";

type Props = {
  /** Salary at the baseline (earlier) year — anchors the parity line. */
  baselineSalary: number;
  baselineYear: number;
  nowYear: number;
  /** Actual later-year salary, plotted against the parity line. Omit to hide it. */
  actualNow?: number;
};

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

/**
 * The euro figure you'd need each year to keep the baseline salary's buying power
 * (the parity line), with the actual later-year salary marked against it.
 */
export default function PurchasingPowerChart({
  baselineSalary,
  baselineYear,
  nowYear,
  actualNow,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const earlier = Math.min(baselineYear, nowYear);
  const later = Math.max(baselineYear, nowYear);
  const span = Math.max(1, later - earlier);

  const compact = width > 0 && width < 480;
  const height = compact ? 200 : 240;
  const PAD = { top: 18, right: 16, bottom: 28, left: compact ? 46 : 58 };

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = Math.max(1, height - PAD.top - PAD.bottom);

  const years: number[] = [];
  for (let y = earlier; y <= later; y++) years.push(y);
  const valueOf = (year: number) => convert(baselineSalary, baselineYear, year);

  const target = valueOf(nowYear);
  const actualBelow = actualNow !== undefined && actualNow < target;

  const rawMax = Math.max(1, ...years.map(valueOf), actualNow ?? 0);
  const maxY = niceCeil(rawMax);

  const xOf = (year: number) => PAD.left + ((year - earlier) / span) * plotW;
  const yOf = (value: number) => PAD.top + plotH - (value / maxY) * plotH;

  const linePts = years.map((y) => `${xOf(y)},${yOf(valueOf(y))}`);
  const areaPts =
    `${xOf(earlier)},${yOf(0)} ` + linePts.join(" ") + ` ${xOf(later)},${yOf(0)}`;

  const yTicks = 4;
  const gridY = Array.from({ length: yTicks + 1 }, (_, i) => (maxY / yTicks) * i);

  const targetTicks = width < 420 ? 4 : 6;
  const xStep = Math.max(1, Math.round(span / targetTicks));
  const gridX: number[] = [];
  for (let y = earlier; y <= later; y += xStep) gridX.push(y);
  // Always label the final year, but drop the previous tick if it would crowd it.
  const last = gridX[gridX.length - 1];
  if (last !== later) {
    if (later - last < xStep * 0.6) gridX.pop();
    gridX.push(later);
  }

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left) * (width / Math.max(1, rect.width));
    const yearGuess = earlier + ((x - PAD.left) / plotW) * span;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < years.length; i++) {
      const d = Math.abs(years[i] - yearGuess);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setActive(nearest);
  }

  const activeYear = active !== null ? years[active] : null;

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 200 }}>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block touch-pan-y select-none"
          role="img"
          aria-label="Salary buying power across the years"
          onPointerDown={(e) => pointerToIndex(e.clientX)}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.buttons > 0 || e.pressure > 0)
              pointerToIndex(e.clientX);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
          <defs>
            <linearGradient id="ppFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridY.map((v, i) => (
            <g key={`gy-${i}`}>
              <line
                x1={PAD.left}
                y1={yOf(v)}
                x2={width - PAD.right}
                y2={yOf(v)}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={yOf(v) + 4}
                textAnchor="end"
                className="fill-zinc-400 text-[11px]"
              >
                {compactEur(v)}
              </text>
            </g>
          ))}

          {gridX.map((y, i) => (
            <text
              key={`gx-${i}`}
              x={xOf(y)}
              y={height - PAD.bottom + 17}
              textAnchor="middle"
              className="fill-zinc-400 text-[11px]"
            >
              {y}
            </text>
          ))}

          <polygon points={areaPts} fill="url(#ppFill)" />
          <polyline
            points={linePts.join(" ")}
            fill="none"
            className="stroke-emerald-500"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Baseline salary and the parity target on the line. */}
          {[baselineYear, nowYear].map((y, i) => (
            <circle
              key={`dot-${i}`}
              cx={xOf(y)}
              cy={yOf(valueOf(y))}
              r={4.5}
              className="fill-emerald-500 stroke-white dark:stroke-zinc-900"
              strokeWidth={1.5}
            />
          ))}

          {/* Actual later-year salary, with a dashed connector showing the gap. */}
          {actualNow !== undefined && (
            <g>
              <line
                x1={xOf(nowYear)}
                y1={yOf(target)}
                x2={xOf(nowYear)}
                y2={yOf(actualNow)}
                className={
                  actualBelow ? "stroke-amber-500" : "stroke-emerald-600"
                }
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <circle
                cx={xOf(nowYear)}
                cy={yOf(actualNow)}
                r={4.5}
                className={`${
                  actualBelow ? "fill-amber-500" : "fill-emerald-600"
                } stroke-white dark:stroke-zinc-900`}
                strokeWidth={1.5}
              />
            </g>
          )}

          {/* Hover / touch marker. */}
          {activeYear !== null && (
            <g>
              <line
                x1={xOf(activeYear)}
                y1={PAD.top}
                x2={xOf(activeYear)}
                y2={PAD.top + plotH}
                className="stroke-zinc-300 dark:stroke-zinc-600"
                strokeWidth={1}
              />
              <circle
                cx={xOf(activeYear)}
                cy={yOf(valueOf(activeYear))}
                r={5}
                className="fill-emerald-500 stroke-white dark:stroke-zinc-900"
                strokeWidth={1.5}
              />
            </g>
          )}
        </svg>
      )}

      <div className="mt-1 flex min-h-[1.25rem] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-xs text-zinc-500 dark:text-zinc-400">
        {activeYear !== null ? (
          <span>
            In{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {activeYear}
            </span>{" "}
            you&apos;d need{" "}
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatEur(valueOf(activeYear))}
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
    </div>
  );
}
