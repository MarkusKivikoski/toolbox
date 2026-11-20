"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useGridDragReorder } from "@/hooks/useGridDragReorder";
import { useToolOrder } from "@/hooks/useToolOrder";
import type { Tool } from "@/lib/tools";
import ToolCard from "./ToolCard";

const PREVIOUS_KEYS = ["ArrowUp", "ArrowLeft"];
const NEXT_KEYS = ["ArrowDown", "ArrowRight"];

type Props = {
  tools: Tool[];
};

export default function ToolGrid({ tools }: Props) {
  const { orderedItems, moveItem, resetOrder, isCustomOrder } =
    useToolOrder(tools);
  const { listRef, dragSlug, startDrag } = useGridDragReorder({
    onMove: moveItem,
  });

  const handleHandleKeyDown = (
    event: ReactKeyboardEvent,
    slug: string,
    index: number,
  ) => {
    if (PREVIOUS_KEYS.includes(event.key)) {
      event.preventDefault();
      moveItem(slug, index - 1);
    } else if (NEXT_KEYS.includes(event.key)) {
      event.preventDefault();
      moveItem(slug, index + 1);
    }
  };

  return (
    <>
      <div className="mt-6 flex min-h-6 justify-end">
        {isCustomOrder && (
          <button
            type="button"
            onClick={resetOrder}
            className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Reset order
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className={`mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          dragSlug ? "select-none" : ""
        }`}
      >
        {orderedItems.map((tool, index) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            isDragging={dragSlug === tool.slug}
            onHandlePointerDown={(event) => startDrag(event, tool.slug)}
            onHandleKeyDown={(event) =>
              handleHandleKeyDown(event, tool.slug, index)
            }
          />
        ))}

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
          More tools coming soon
        </div>
      </div>
    </>
  );
}
