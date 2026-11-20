import { memo, useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Heading } from "@/lib/party-guest-list";
import { COPY } from "../copy";
import { HEADING_TITLE_SPAN_CLASS, ROW_GRID_CLASS } from "../constants";
import DragHandle from "@/components/DragHandle";
import RemoveButton from "./RemoveButton";
import type { DragKind } from "../hooks/useGuestDragReorder";

type Props = {
  heading: Heading;
  isDragging: boolean;
  /** Focus the title input on mount — set for a freshly added section. */
  autoFocus: boolean;
  onAutoFocused: () => void;
  onTitle: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  /** Enter in the title: open the section's first guest. */
  onInsertAfter: (id: string, isPlusOne: boolean) => void;
  onDragPointerDown: (event: ReactPointerEvent, id: string, kind: DragKind) => void;
  onHandleKeyDown: (event: ReactKeyboardEvent, id: string) => void;
};

/** A section title. Everything below it belongs to it until the next one. */
function HeadingRow({
  heading,
  isDragging,
  autoFocus,
  onAutoFocused,
  onTitle,
  onRemove,
  onInsertAfter,
  onDragPointerDown,
  onHandleKeyDown,
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null);
  const displayTitle = heading.title.trim() || COPY.fallbackSectionNoun;

  useEffect(() => {
    if (!autoFocus) return;
    titleRef.current?.focus();
    onAutoFocused();
  }, [autoFocus, onAutoFocused]);

  function handleTitleKeyDown(event: ReactKeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!heading.title.trim()) return;
    onInsertAfter(heading.id, false);
  }

  return (
    <div
      data-row-id={heading.id}
      data-block-id={heading.id}
      data-section-id={heading.id}
      className={`${ROW_GRID_CLASS} border-b border-zinc-200 pb-1 transition-opacity dark:border-zinc-800 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <DragHandle
        ariaLabel={`Reorder section ${displayTitle}`}
        onPointerDown={(event) => onDragPointerDown(event, heading.id, "heading")}
        onKeyDown={(event) => onHandleKeyDown(event, heading.id)}
      />
      <input
        ref={titleRef}
        type="text"
        value={heading.title}
        onChange={(event) => onTitle(heading.id, event.target.value)}
        onKeyDown={handleTitleKeyDown}
        placeholder={COPY.sectionTitlePlaceholder}
        aria-label="Section title"
        className={`${HEADING_TITLE_SPAN_CLASS} w-full min-w-0 bg-transparent py-2 text-sm font-semibold tracking-wide text-zinc-700 uppercase outline-none placeholder:text-zinc-300 placeholder:normal-case dark:text-zinc-300 dark:placeholder:text-zinc-600`}
      />
      <RemoveButton
        ariaLabel={`Remove section ${displayTitle}`}
        onClick={() => onRemove(heading.id)}
      />
    </div>
  );
}

export default memo(HeadingRow);
