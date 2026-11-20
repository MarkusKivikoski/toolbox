import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const ITEM_SELECTOR = "[data-slug]";

type Options = {
  /** Called when the dragged item should take the given index in the list. */
  onMove: (slug: string, targetIndex: number) => void;
};

/**
 * Pointer-based drag-to-reorder for a 2D grid (mouse and touch). The dragged
 * item takes the slot of whichever item's centre is nearest the pointer.
 * Items are found via `data-slug` attributes inside the `listRef` container.
 * Window listeners share one `AbortController` so ending a drag is one call.
 */
export function useGridDragReorder({ onMove }: Options) {
  const listRef = useRef<HTMLDivElement>(null);
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const dragSlugRef = useRef<string | null>(null);
  const listenersRef = useRef<AbortController | null>(null);

  const moveToPointer = useCallback(
    (clientX: number, clientY: number) => {
      const container = listRef.current;
      const draggingSlug = dragSlugRef.current;
      if (!container || !draggingSlug) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
      );
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      items.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.hypot(
          clientX - (rect.left + rect.width / 2),
          clientY - (rect.top + rect.height / 2),
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const currentIndex = items.findIndex(
        (element) => element.dataset.slug === draggingSlug,
      );
      if (nearestIndex !== -1 && nearestIndex !== currentIndex) {
        onMove(draggingSlug, nearestIndex);
      }
    },
    [onMove],
  );

  const endDrag = useCallback(() => {
    dragSlugRef.current = null;
    setDragSlug(null);
    listenersRef.current?.abort();
    listenersRef.current = null;
  }, []);

  const startDrag = useCallback(
    (event: ReactPointerEvent, slug: string) => {
      event.preventDefault();
      dragSlugRef.current = slug;
      setDragSlug(slug);

      const controller = new AbortController();
      listenersRef.current = controller;
      const { signal } = controller;
      window.addEventListener(
        "pointermove",
        (pointerEvent) => moveToPointer(pointerEvent.clientX, pointerEvent.clientY),
        { signal },
      );
      window.addEventListener("pointerup", endDrag, { signal });
      window.addEventListener("pointercancel", endDrag, { signal });
    },
    [moveToPointer, endDrag],
  );

  // Drop any stray listeners if we unmount mid-drag.
  useEffect(() => endDrag, [endDrag]);

  return { listRef, dragSlug, startDrag };
}
