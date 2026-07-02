"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CHART_HEIGHT_COMPACT } from "../constants";
import { useElementWidth } from "../hooks/useElementWidth";
import { buildChartModel } from "./chartGeometry";
import ChartAxes from "./ChartAxes";
import ChartLine from "./ChartLine";
import ChartHoverMarker from "./ChartHoverMarker";
import ChartCaption from "./ChartCaption";

type Props = {
  /** Salary at the baseline (earlier) year — anchors the parity line. */
  baselineSalary: number;
  baselineYear: number;
  nowYear: number;
  /** Actual later-year salary, plotted against the parity line. Omit to hide it. */
  actualNow?: number;
};

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
  const width = useElementWidth(containerRef);
  const [active, setActive] = useState<number | null>(null);

  const {
    geometry,
    years,
    valueOf,
    target,
    actualBelow,
    gridY,
    gridX,
    linePoints,
    areaPoints,
  } = buildChartModel({ width, baselineSalary, baselineYear, nowYear, actualNow });

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const localX = (clientX - rect.left) * (width / Math.max(1, rect.width));
    const span = Math.max(1, years[years.length - 1] - years[0]);
    const yearGuess =
      years[0] + ((localX - geometry.pad.left) / geometry.plotW) * span;
    let nearest = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < years.length; index++) {
      const distance = Math.abs(years[index] - yearGuess);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = index;
      }
    }
    setActive(nearest);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" || event.buttons > 0 || event.pressure > 0)
      pointerToIndex(event.clientX);
  }

  function handlePointerLeave(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse") setActive(null);
  }

  const activeYear = active !== null ? years[active] : null;

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ minHeight: CHART_HEIGHT_COMPACT }}
    >
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={geometry.height}
          viewBox={`0 0 ${width} ${geometry.height}`}
          className="block touch-pan-y select-none"
          role="img"
          aria-label="Salary buying power across the years"
          onPointerDown={(event) => pointerToIndex(event.clientX)}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id="ppFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <ChartAxes geometry={geometry} gridY={gridY} gridX={gridX} />
          <ChartLine
            geometry={geometry}
            areaPoints={areaPoints}
            linePoints={linePoints}
            valueOf={valueOf}
            baselineYear={baselineYear}
            nowYear={nowYear}
            target={target}
            actualNow={actualNow}
            actualBelow={actualBelow}
          />
          {activeYear !== null && (
            <ChartHoverMarker
              geometry={geometry}
              year={activeYear}
              value={valueOf(activeYear)}
            />
          )}
        </svg>
      )}

      <ChartCaption
        activeYear={activeYear}
        activeValue={activeYear !== null ? valueOf(activeYear) : null}
        target={target}
        nowYear={nowYear}
        actualNow={actualNow}
        actualBelow={actualBelow}
      />
    </div>
  );
}
