import { convert } from "@/lib/cost-of-living";
import {
  CHART_HEIGHT_COMPACT,
  CHART_HEIGHT_DEFAULT,
  CHART_PAD_BOTTOM,
  CHART_PAD_LEFT_COMPACT,
  CHART_PAD_LEFT_DEFAULT,
  CHART_PAD_RIGHT,
  CHART_PAD_TOP,
  COMPACT_BREAKPOINT_PX,
  TICK_CROWDING_FACTOR,
  X_TICKS_NARROW,
  X_TICKS_WIDE,
  XTICK_BREAKPOINT_PX,
  Y_AXIS_TICK_COUNT,
} from "../constants";

export type ChartPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ChartGeometry = {
  width: number;
  height: number;
  pad: ChartPadding;
  plotW: number;
  plotH: number;
  /** X pixel for a calendar year. */
  xOf: (year: number) => number;
  /** Y pixel for a euro value. */
  yOf: (value: number) => number;
};

export type ChartModel = {
  geometry: ChartGeometry;
  /** Every year from baseline to now, inclusive — the plotted series. */
  years: number[];
  /** Parity euros needed in a given year to match the baseline's buying power. */
  valueOf: (year: number) => number;
  /** The parity target in the later year. */
  target: number;
  /** Whether the actual later salary sits below the parity line. */
  actualBelow: boolean;
  /** Y-axis tick values, in euros. */
  gridY: number[];
  /** X-axis tick years. */
  gridX: number[];
  /** SVG `points` for the parity polyline. */
  linePoints: string;
  /** SVG `points` for the filled area under the line. */
  areaPoints: string;
};

/** Round up to a "nice" axis maximum: 1/2/5/10 times a power of ten. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export type ChartInputs = {
  width: number;
  baselineSalary: number;
  baselineYear: number;
  nowYear: number;
  actualNow?: number;
};

/** Derive every coordinate, tick, and path the chart needs from its inputs. */
export function buildChartModel({
  width,
  baselineSalary,
  baselineYear,
  nowYear,
  actualNow,
}: ChartInputs): ChartModel {
  const earlier = Math.min(baselineYear, nowYear);
  const later = Math.max(baselineYear, nowYear);
  const span = Math.max(1, later - earlier);

  const compact = width > 0 && width < COMPACT_BREAKPOINT_PX;
  const height = compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_DEFAULT;
  const pad: ChartPadding = {
    top: CHART_PAD_TOP,
    right: CHART_PAD_RIGHT,
    bottom: CHART_PAD_BOTTOM,
    left: compact ? CHART_PAD_LEFT_COMPACT : CHART_PAD_LEFT_DEFAULT,
  };

  const plotW = Math.max(1, width - pad.left - pad.right);
  const plotH = Math.max(1, height - pad.top - pad.bottom);

  const years: number[] = [];
  for (let year = earlier; year <= later; year++) years.push(year);
  const valueOf = (year: number) => convert(baselineSalary, baselineYear, year);

  const target = valueOf(nowYear);
  const actualBelow = actualNow !== undefined && actualNow < target;

  const rawMax = Math.max(1, ...years.map(valueOf), actualNow ?? 0);
  const maxY = niceCeil(rawMax);

  const xOf = (year: number) => pad.left + ((year - earlier) / span) * plotW;
  const yOf = (value: number) => pad.top + plotH - (value / maxY) * plotH;

  const geometry: ChartGeometry = { width, height, pad, plotW, plotH, xOf, yOf };

  const gridY = Array.from(
    { length: Y_AXIS_TICK_COUNT + 1 },
    (_, index) => (maxY / Y_AXIS_TICK_COUNT) * index,
  );

  const targetTicks = width < XTICK_BREAKPOINT_PX ? X_TICKS_NARROW : X_TICKS_WIDE;
  const xStep = Math.max(1, Math.round(span / targetTicks));
  const gridX: number[] = [];
  for (let year = earlier; year <= later; year += xStep) gridX.push(year);
  // Always label the final year, but drop the previous tick if it would crowd it.
  const lastTick = gridX[gridX.length - 1];
  if (lastTick !== later) {
    if (later - lastTick < xStep * TICK_CROWDING_FACTOR) gridX.pop();
    gridX.push(later);
  }

  const linePoints = years
    .map((year) => `${xOf(year)},${yOf(valueOf(year))}`)
    .join(" ");
  const areaPoints =
    `${xOf(earlier)},${yOf(0)} ` + linePoints + ` ${xOf(later)},${yOf(0)}`;

  return {
    geometry,
    years,
    valueOf,
    target,
    actualBelow,
    gridY,
    gridX,
    linePoints,
    areaPoints,
  };
}
