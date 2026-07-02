import { ACTIVE_DOT_RADIUS } from "../constants";
import type { ChartGeometry } from "./chartGeometry";

type Props = {
  geometry: ChartGeometry;
  year: number;
  value: number;
};

/** The vertical guide and dot tracking the hovered/touched year. */
export default function ChartHoverMarker({ geometry, year, value }: Props) {
  const { pad, plotH, xOf, yOf } = geometry;
  return (
    <g>
      <line
        x1={xOf(year)}
        y1={pad.top}
        x2={xOf(year)}
        y2={pad.top + plotH}
        className="stroke-zinc-300 dark:stroke-zinc-600"
        strokeWidth={1}
      />
      <circle
        cx={xOf(year)}
        cy={yOf(value)}
        r={ACTIVE_DOT_RADIUS}
        className="fill-emerald-500 stroke-white dark:stroke-zinc-900"
        strokeWidth={1.5}
      />
    </g>
  );
}
