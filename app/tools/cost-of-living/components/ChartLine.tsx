import { DOT_RADIUS } from "../constants";
import type { ChartGeometry } from "./chartGeometry";

type Props = {
  geometry: ChartGeometry;
  areaPoints: string;
  linePoints: string;
  valueOf: (year: number) => number;
  baselineYear: number;
  nowYear: number;
  target: number;
  actualNow?: number;
  actualBelow: boolean;
};

/**
 * The parity line and its filled area, the baseline/target dots, and — when an
 * actual later salary is supplied — the marker and dashed connector showing the
 * gap to the parity line.
 */
export default function ChartLine({
  geometry,
  areaPoints,
  linePoints,
  valueOf,
  baselineYear,
  nowYear,
  target,
  actualNow,
  actualBelow,
}: Props) {
  const { xOf, yOf } = geometry;
  return (
    <>
      <polygon points={areaPoints} fill="url(#ppFill)" />
      <polyline
        points={linePoints}
        fill="none"
        className="stroke-emerald-500"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Baseline salary and the parity target on the line. */}
      {[baselineYear, nowYear].map((year, index) => (
        <circle
          key={`dot-${index}`}
          cx={xOf(year)}
          cy={yOf(valueOf(year))}
          r={DOT_RADIUS}
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
            className={actualBelow ? "stroke-amber-500" : "stroke-emerald-600"}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <circle
            cx={xOf(nowYear)}
            cy={yOf(actualNow)}
            r={DOT_RADIUS}
            className={`${
              actualBelow ? "fill-amber-500" : "fill-emerald-600"
            } stroke-white dark:stroke-zinc-900`}
            strokeWidth={1.5}
          />
        </g>
      )}
    </>
  );
}
