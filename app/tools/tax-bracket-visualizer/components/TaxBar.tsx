import { memo } from "react";
import { SEGMENT_COLORS, type GrossAllocationSegment } from "@/lib/tax-bracket-visualizer";
import { MIN_SEGMENT_WIDTH_PX } from "../constants";

type Props = {
  segments: GrossAllocationSegment[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

/**
 * The stacked "where each euro goes" bar: contributions, each state bracket's
 * tax, municipal tax and net pay, sized by their share of gross. Hover
 * highlights a segment; tap/click toggles it for touch screens.
 */
function TaxBar({ segments, activeId, onActiveChange }: Props) {
  return (
    <div
      className="flex h-9 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      onMouseLeave={() => onActiveChange(null)}
    >
      {segments.map((segment) => {
        const isActive = segment.id === activeId;
        const isDimmed = activeId !== null && !isActive;
        return (
          <button
            key={segment.id}
            type="button"
            aria-label={segment.label}
            aria-pressed={isActive}
            // Only a real mouse hovers — a tap synthesizes enter+click, which
            // would set and immediately toggle the segment off again.
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") onActiveChange(segment.id);
            }}
            onFocus={(event) => {
              if (event.target.matches(":focus-visible")) onActiveChange(segment.id);
            }}
            onClick={() => onActiveChange(isActive ? null : segment.id)}
            className={`h-full transition-opacity duration-150 outline-none ${
              isDimmed ? "opacity-40" : "opacity-100"
            } ${isActive ? "ring-2 ring-inset ring-white/80 dark:ring-zinc-950/60" : ""}`}
            style={{
              width: `${segment.fraction * 100}%`,
              minWidth: `${MIN_SEGMENT_WIDTH_PX}px`,
              backgroundColor: SEGMENT_COLORS[segment.id],
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(TaxBar);
