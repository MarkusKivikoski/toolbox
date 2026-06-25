"use client";

import { useEffect, useRef, useState } from "react";
import type { YearPoint } from "@/lib/investing";
import { compactEur, formatEur } from "@/lib/format";

type Props = {
  points: YearPoint[];
  accumulationYears: number;
  /** Show the inflation-adjusted ("today's money") line. */
  showReal?: boolean;
};

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

export default function BalanceChart({
  points,
  accumulationYears,
  showReal = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Render at the container's real pixel width so text stays crisp on any device.
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

  const compact = width > 0 && width < 480;
  const height = width < 480 ? 230 : width < 768 ? 290 : 330;
  const PAD = {
    top: 18,
    right: 14,
    bottom: 28,
    left: compact ? 44 : 56,
  };

  const lastYear = points[points.length - 1]?.year ?? 0;
  const maxYear = Math.max(1, lastYear);
  const rawMax = Math.max(
    1,
    ...points.map((p) => Math.max(p.balance, p.contributed))
  );
  const maxY = niceCeil(rawMax);

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = Math.max(1, height - PAD.top - PAD.bottom);

  const xOf = (year: number) => PAD.left + (year / maxYear) * plotW;
  const yOf = (value: number) => PAD.top + plotH - (value / maxY) * plotH;

  const balanceLine = points.map((p) => `${xOf(p.year)},${yOf(p.balance)}`);
  const balanceArea =
    `${xOf(0)},${yOf(0)} ` + balanceLine.join(" ") + ` ${xOf(maxYear)},${yOf(0)}`;
  const contributedLine = points
    .map((p) => `${xOf(p.year)},${yOf(p.contributed)}`)
    .join(" ");
  const realLine = points
    .map((p) => `${xOf(p.year)},${yOf(p.realBalance)}`)
    .join(" ");

  const yTicks = 4;
  const gridY = Array.from({ length: yTicks + 1 }, (_, i) => (maxY / yTicks) * i);

  const targetTicks = width < 420 ? 4 : width < 700 ? 6 : 8;
  const xStep = Math.max(1, Math.round(maxYear / targetTicks));
  const gridX: number[] = [];
  for (let y = 0; y <= maxYear; y += xStep) gridX.push(y);
  if (gridX[gridX.length - 1] !== maxYear) gridX.push(maxYear);

  const currentAge = points[0]?.age ?? 0;
  const retireX = xOf(accumulationYears);
  const showRetire = accumulationYears > 0 && accumulationYears < maxYear;

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left) * (width / Math.max(1, rect.width));
    const yearGuess = ((x - PAD.left) / plotW) * maxYear;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].year - yearGuess);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setActive(nearest);
  }

  const hp = active !== null ? points[active] : null;

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 230 }}>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block touch-pan-y select-none"
          role="img"
          aria-label="Balance over time"
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
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="transparent" />

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
              {currentAge + y}
            </text>
          ))}

          {showRetire && (
            <g>
              <line
                x1={retireX}
                y1={PAD.top}
                x2={retireX}
                y2={PAD.top + plotH}
                className="stroke-amber-400/80"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={retireX + 4}
                y={PAD.top + 11}
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

          {showReal && (
            <polyline
              points={realLine}
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

          {hp && (
            <g>
              <line
                x1={xOf(hp.year)}
                y1={PAD.top}
                x2={xOf(hp.year)}
                y2={PAD.top + plotH}
                className="stroke-zinc-300 dark:stroke-zinc-600"
                strokeWidth={1}
              />
              <circle
                cx={xOf(hp.year)}
                cy={yOf(hp.contributed)}
                r={3.5}
                className="fill-zinc-400"
              />
              {showReal && (
                <circle
                  cx={xOf(hp.year)}
                  cy={yOf(hp.realBalance)}
                  r={3.5}
                  className="fill-violet-500"
                />
              )}
              <circle
                cx={xOf(hp.year)}
                cy={yOf(hp.balance)}
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
          {showReal && (
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
        {hp ? (
          <div className="text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">Age {hp.age}</span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatEur(hp.balance)}
            </span>
            {showReal && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-violet-600 dark:text-violet-400">
                  {formatEur(hp.realBalance)} today
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
