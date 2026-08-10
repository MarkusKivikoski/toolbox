import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  ariaLabel: string;
  onPointerDown: (event: ReactPointerEvent) => void;
  onKeyDown: (event: ReactKeyboardEvent) => void;
};

/** The grip that starts a drag — and, with a keyboard, moves and indents. */
export default function DragHandle({ ariaLabel, onPointerDown, onKeyDown }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="flex h-9 w-5 cursor-grab touch-none items-center justify-center rounded text-zinc-300 outline-none hover:text-zinc-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <circle cx="7.5" cy="5" r="1.4" />
        <circle cx="12.5" cy="5" r="1.4" />
        <circle cx="7.5" cy="10" r="1.4" />
        <circle cx="12.5" cy="10" r="1.4" />
        <circle cx="7.5" cy="15" r="1.4" />
        <circle cx="12.5" cy="15" r="1.4" />
      </svg>
    </button>
  );
}
