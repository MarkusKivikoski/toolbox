import { memo, useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { BudgetRow } from "@/lib/budget";
import { capitalizeFirst } from "../utils";

type Props = {
  row: BudgetRow;
  ariaPrefix: string;
  namePlaceholder: string;
  fallbackNoun: string;
  dotColor?: string;
  showDot: boolean;
  /** Focus the name input on mount — set for a freshly added row. */
  autoFocus: boolean;
  onAutoFocused: () => void;
  onName: (value: string) => void;
  onAmount: (value: string) => void;
  onRemove: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** When set, a drag handle is shown and the row can be reordered. */
  dragging?: boolean;
  onDragPointerDown?: (event: ReactPointerEvent) => void;
  onHandleKeyDown?: (event: ReactKeyboardEvent) => void;
};

/** Shared editable line: name + euro amount + remove, with an optional colour dot. */
function RowEditor({
  row,
  ariaPrefix,
  namePlaceholder,
  fallbackNoun,
  dotColor,
  showDot,
  autoFocus,
  onAutoFocused,
  onName,
  onAmount,
  onRemove,
  onMouseEnter,
  onMouseLeave,
  dragging,
  onDragPointerDown,
  onHandleKeyDown,
}: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const draggable = onDragPointerDown != null;

  useEffect(() => {
    if (!autoFocus) return;
    nameRef.current?.focus();
    onAutoFocused();
  }, [autoFocus, onAutoFocused]);

  return (
    <div
      data-row-id={row.id}
      className={`grid items-center gap-2 rounded-xl transition-opacity ${
        draggable
          ? "grid-cols-[1.25rem_1fr_6.5rem_2.25rem]"
          : "grid-cols-[1fr_6.5rem_2.25rem]"
      } ${dragging ? "opacity-50" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {draggable && (
        <button
          type="button"
          aria-label={`Reorder ${row.name.trim() || fallbackNoun}`}
          onPointerDown={onDragPointerDown}
          onKeyDown={onHandleKeyDown}
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
      )}
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        {showDot && (
          <span
            className="mr-2 h-3 w-3 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
        )}
        <input
          ref={nameRef}
          type="text"
          value={row.name}
          onChange={(e) => onName(capitalizeFirst(e.target.value))}
          placeholder={namePlaceholder}
          aria-label={`${ariaPrefix} name`}
          className="w-full min-w-0 bg-transparent py-2.5 text-base font-medium outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
      <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-400">€</span>
        <input
          type="text"
          inputMode="decimal"
          value={row.amount}
          onChange={(e) => onAmount(e.target.value)}
          placeholder="0"
          aria-label={`${ariaPrefix} amount`}
          className="w-full min-w-0 bg-transparent py-2.5 pl-1 text-base font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${row.name.trim() || fallbackNoun}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

export default memo(RowEditor);
