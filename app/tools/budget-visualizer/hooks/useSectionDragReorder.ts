import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Options = {
  /** Called with the section ids in their new order as the pointer moves. */
  onReorder: (orderedIds: string[]) => void;
  /** Runs when a drag begins — used to clear any hover highlight. */
  onDragStart: () => void;
};

/**
 * Pointer-based drag-to-reorder for the sections list (works with mouse and
 * touch). Owns the list container ref so it can measure row midpoints; the
 * actual state update is delegated to `onReorder`.
 *
 * The window listeners for a drag are grouped under one `AbortController`, so
 * ending the drag is a single `abort()` — no need for the handler to reference
 * itself when tearing down.
 */
export function useSectionDragReorder({ onReorder, onDragStart }: Options) {
  const listRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragListenersRef = useRef<AbortController | null>(null);

  // Slot the dragged row wherever the pointer is by comparing against the
  // midpoints of the other rows currently on screen.
  const reorderToPointer = useCallback(
    (clientY: number) => {
      const container = listRef.current;
      const draggingId = dragIdRef.current;
      if (!container || !draggingId) return;
      const rows = Array.from(
        container.querySelectorAll<HTMLElement>("[data-row-id]"),
      );
      const orderedIds: string[] = [];
      let insertAt = 0;
      for (const element of rows) {
        const id = element.dataset.rowId!;
        if (id === draggingId) continue;
        const rect = element.getBoundingClientRect();
        if (clientY > rect.top + rect.height / 2) insertAt = orderedIds.length + 1;
        orderedIds.push(id);
      }
      orderedIds.splice(insertAt, 0, draggingId);
      onReorder(orderedIds);
    },
    [onReorder],
  );

  const endDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    dragListenersRef.current?.abort();
    dragListenersRef.current = null;
  }, []);

  const startDrag = useCallback(
    (event: ReactPointerEvent, id: string) => {
      event.preventDefault();
      dragIdRef.current = id;
      setDragId(id);
      onDragStart();

      const controller = new AbortController();
      dragListenersRef.current = controller;
      const { signal } = controller;
      window.addEventListener(
        "pointermove",
        (pointerEvent) => reorderToPointer(pointerEvent.clientY),
        { signal },
      );
      window.addEventListener("pointerup", endDrag, { signal });
      window.addEventListener("pointercancel", endDrag, { signal });
    },
    [reorderToPointer, endDrag, onDragStart],
  );

  // Drop any stray listeners if we unmount mid-drag.
  useEffect(() => endDrag, [endDrag]);

  return { listRef, dragId, startDrag };
}
