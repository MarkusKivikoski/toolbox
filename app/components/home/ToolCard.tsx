import Link from "next/link";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import DragHandle from "@/components/DragHandle";
import type { Tool } from "@/lib/tools";

type Props = {
  tool: Tool;
  isDragging: boolean;
  onHandlePointerDown: (event: ReactPointerEvent) => void;
  onHandleKeyDown: (event: ReactKeyboardEvent) => void;
};

export default function ToolCard({
  tool,
  isDragging,
  onHandlePointerDown,
  onHandleKeyDown,
}: Props) {
  return (
    <div
      data-slug={tool.slug}
      className={`relative flex ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <Link
        href={tool.href}
        draggable={false}
        className="group flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div className="text-3xl">{tool.emoji}</div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">{tool.name}</h2>
        <p className="mt-1.5 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          {tool.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Open
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.21 4.23a.75.75 0 0 1 1.06.02l5 5.25a.75.75 0 0 1 0 1.04l-5 5.25a.75.75 0 1 1-1.08-1.04L11.67 10 7.23 5.29a.75.75 0 0 1-.02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </Link>
      <div className="absolute right-3 top-3">
        <DragHandle
          ariaLabel={`Move ${tool.name}`}
          onPointerDown={onHandlePointerDown}
          onKeyDown={onHandleKeyDown}
        />
      </div>
    </div>
  );
}
