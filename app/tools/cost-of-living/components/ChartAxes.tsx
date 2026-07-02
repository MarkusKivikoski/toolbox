import { compactEur } from "@/lib/format";
import type { ChartGeometry } from "./chartGeometry";

type Props = {
  geometry: ChartGeometry;
  gridY: number[];
  gridX: number[];
};

/** Horizontal value gridlines with euro labels, plus the year labels along the x-axis. */
export default function ChartAxes({ geometry, gridY, gridX }: Props) {
  const { pad, width, height, xOf, yOf } = geometry;
  return (
    <>
      {gridY.map((value, index) => (
        <g key={`gy-${index}`}>
          <line
            x1={pad.left}
            y1={yOf(value)}
            x2={width - pad.right}
            y2={yOf(value)}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth={1}
          />
          <text
            x={pad.left - 6}
            y={yOf(value) + 4}
            textAnchor="end"
            className="fill-zinc-400 text-[11px]"
          >
            {compactEur(value)}
          </text>
        </g>
      ))}

      {gridX.map((year, index) => (
        <text
          key={`gx-${index}`}
          x={xOf(year)}
          y={height - pad.bottom + 17}
          textAnchor="middle"
          className="fill-zinc-400 text-[11px]"
        >
          {year}
        </text>
      ))}
    </>
  );
}
