import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { INDENT_DRAG_THRESHOLD_PX } from "../constants";

/** What's being dragged, which decides what travels with it. */
export type DragKind = "guest" | "plus-one" | "heading";

type Options = {
  /** Move the dragged block so it starts at `targetIndex` in the list-minus-block. */
  onMove: (id: string, targetIndex: number) => void;
  /** Called only when the horizontal drag crosses the indent threshold. */
  onIndentChange: (id: string, shouldBePlusOne: boolean) => void;
};

/**
 * Pointer-based drag for the guest list, reading both axes off one gesture:
 * vertical moves the row, horizontal indents or outdents a guest. Works with
 * mouse and touch.
 *
 * It owns the list container ref so it can measure row midpoints, and skips
 * the rows travelling with the drag. Every row carries `data-block-id` (the
 * main guest it belongs to) and `data-section-id` (the heading it sits under),
 * which is what makes "skip my plus-ones" and "skip my whole section" one
 * attribute lookup each. Window listeners are grouped under a single
 * `AbortController`, so ending a drag is one `abort()`.
 */
export function useGuestDragReorder({ onMove, onIndentChange }: Options) {
  const listRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const kindRef = useRef<DragKind>("guest");
  const startXRef = useRef(0);
  const dragListenersRef = useRef<AbortController | null>(null);

  // Slot the dragged block wherever the pointer is, by comparing against the
  // midpoints of the rows that aren't moving with it.
  const moveToPointer = useCallback(
    (clientY: number) => {
      const container = listRef.current;
      const draggingId = dragIdRef.current;
      if (!container || !draggingId) return;
      const rows = container.querySelectorAll<HTMLElement>("[data-row-id]");
      let insertAt = 0;
      let seen = 0;
      for (const element of rows) {
        if (travelsWithDrag(element, draggingId, kindRef.current)) continue;
        const rect = element.getBoundingClientRect();
        seen += 1;
        if (clientY > rect.top + rect.height / 2) insertAt = seen;
      }
      onMove(draggingId, insertAt);
    },
    [onMove],
  );

  // Hysteresis: indenting needs a push right, and undoing it needs a pull back
  // past the same distance the other way, so a wobbly finger can't flicker.
  const indentToPointer = useCallback(
    (clientX: number) => {
      const draggingId = dragIdRef.current;
      if (!draggingId || kindRef.current === "heading") return;
      const travelled = clientX - startXRef.current;
      const wasPlusOne = kindRef.current === "plus-one";
      let shouldBePlusOne = wasPlusOne;
      if (travelled > INDENT_DRAG_THRESHOLD_PX) shouldBePlusOne = true;
      else if (travelled < -INDENT_DRAG_THRESHOLD_PX) shouldBePlusOne = false;
      if (shouldBePlusOne === wasPlusOne) return;
      kindRef.current = shouldBePlusOne ? "plus-one" : "guest";
      startXRef.current = clientX;
      onIndentChange(draggingId, shouldBePlusOne);
    },
    [onIndentChange],
  );

  const endDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    dragListenersRef.current?.abort();
    dragListenersRef.current = null;
  }, []);

  const startDrag = useCallback(
    (event: ReactPointerEvent, id: string, kind: DragKind) => {
      event.preventDefault();
      dragIdRef.current = id;
      kindRef.current = kind;
      startXRef.current = event.clientX;
      setDragId(id);

      const controller = new AbortController();
      dragListenersRef.current = controller;
      const { signal } = controller;
      window.addEventListener(
        "pointermove",
        (pointerEvent) => {
          indentToPointer(pointerEvent.clientX);
          moveToPointer(pointerEvent.clientY);
        },
        { signal },
      );
      window.addEventListener("pointerup", endDrag, { signal });
      window.addEventListener("pointercancel", endDrag, { signal });
    },
    [indentToPointer, moveToPointer, endDrag],
  );

  // Drop any stray listeners if we unmount mid-drag.
  useEffect(() => endDrag, [endDrag]);

  return { listRef, dragId, startDrag };
}

/** Is this row part of the block being dragged, and so not worth measuring? */
function travelsWithDrag(
  element: HTMLElement,
  draggingId: string,
  kind: DragKind,
): boolean {
  if (element.dataset.rowId === draggingId) return true;
  if (kind === "plus-one") return false;
  return kind === "heading"
    ? element.dataset.sectionId === draggingId
    : element.dataset.blockId === draggingId;
}
