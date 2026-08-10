import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  groupRowsBySection,
  previousBlockIndex,
  rowBlockRange,
  type ListRow,
} from "@/lib/party-guest-list";
import { COPY, TICK_COLUMNS } from "../copy";
import { ROW_GRID_CLASS } from "../constants";
import SectionGroup from "./SectionGroup";
import AddRowButton from "./AddRowButton";
import type { TickField } from "../hooks/useGuestListActions";
import type { DragKind } from "../hooks/useGuestDragReorder";

type Props = {
  rows: ListRow[];
  listRef: RefObject<HTMLDivElement | null>;
  dragId: string | null;
  focusRowId: string | null;
  onAutoFocused: () => void;
  onLabel: (id: string, value: string) => void;
  onToggleTick: (id: string, field: TickField) => void;
  onRemove: (id: string) => void;
  onInsertAfter: (id: string, isPlusOne: boolean) => void;
  onDragPointerDown: (event: ReactPointerEvent, id: string, kind: DragKind) => void;
  onMove: (id: string, targetIndex: number) => void;
  onIndent: (id: string, shouldBePlusOne: boolean) => void;
  onAddGuest: (headingId: string | null) => void;
  onAddSection: () => void;
};

export default function GuestList({
  rows,
  listRef,
  dragId,
  focusRowId,
  onAutoFocused,
  onLabel,
  onToggleTick,
  onRemove,
  onInsertAfter,
  onDragPointerDown,
  onMove,
  onIndent,
  onAddGuest,
  onAddSection,
}: Props) {
  const groups = groupRowsBySection(rows);

  // Keyboard equivalent of the drag: up/down move the block, right/left indent.
  function handleHandleKeyDown(event: ReactKeyboardEvent, id: string) {
    const range = rowBlockRange(rows, id);
    if (!range) return;
    const [start] = range;
    if (event.key === "ArrowUp") {
      const target = previousBlockIndex(rows, id);
      if (target === null) return;
      event.preventDefault();
      onMove(id, target);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onMove(id, start + 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onIndent(id, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onIndent(id, false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {COPY.guestsHeading}
      </h2>

      {rows.length > 0 && (
        <div
          className={`${ROW_GRID_CLASS} mb-1 text-[0.65rem] font-semibold tracking-wide text-zinc-400 uppercase`}
          aria-hidden
        >
          <span />
          <span className="text-center">{TICK_COLUMNS.confirmed.short}</span>
          <span className="text-center">{TICK_COLUMNS.arrived.short}</span>
          <span />
          <span />
        </div>
      )}

      {rows.length === 0 && (
        <p className="mb-2 text-sm text-zinc-400">{COPY.emptyGuests}</p>
      )}

      <div ref={listRef} className={dragId ? "select-none" : undefined}>
        {groups.map((group, index) => (
          <SectionGroup
            key={group.heading?.id ?? `unsectioned-${index}`}
            group={group}
            dragId={dragId}
            focusRowId={focusRowId}
            onAutoFocused={onAutoFocused}
            onLabel={onLabel}
            onToggleTick={onToggleTick}
            onRemove={onRemove}
            onInsertAfter={onInsertAfter}
            onDragPointerDown={onDragPointerDown}
            onHandleKeyDown={handleHandleKeyDown}
            onAddGuest={onAddGuest}
          />
        ))}
      </div>

      <div className="mt-4">
        <AddRowButton label={COPY.addSection} onClick={onAddSection} isSubtle />
      </div>

      {rows.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">{COPY.dragHint}</p>
      )}
    </section>
  );
}
