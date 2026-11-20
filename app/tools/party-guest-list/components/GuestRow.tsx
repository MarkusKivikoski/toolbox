import { memo, useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Guest } from "@/lib/party-guest-list";
import { COPY } from "../copy";
import { PLUS_ONE_INDENT_CLASS, ROW_GRID_CLASS } from "../constants";
import TickBox from "./TickBox";
import DragHandle from "@/components/DragHandle";
import RemoveButton from "./RemoveButton";
import type { TickField } from "../hooks/useGuestListActions";
import type { DragKind } from "../hooks/useGuestDragReorder";

type Props = {
  guest: Guest;
  /** Id of the main guest this row travels with — its own id when it is one. */
  blockId: string;
  /** Id of the heading this row sits under; empty when un-sectioned. */
  sectionId: string;
  isDragging: boolean;
  /** Focus the name input on mount — set for a freshly added guest. */
  autoFocus: boolean;
  onAutoFocused: () => void;
  onName: (id: string, value: string) => void;
  onToggleTick: (id: string, field: TickField) => void;
  onRemove: (id: string) => void;
  /** Enter in the name field: open a fresh guest below this one. */
  onInsertAfter: (id: string, isPlusOne: boolean) => void;
  onDragPointerDown: (event: ReactPointerEvent, id: string, kind: DragKind) => void;
  onHandleKeyDown: (event: ReactKeyboardEvent, id: string) => void;
};

function GuestRow({
  guest,
  blockId,
  sectionId,
  isDragging,
  autoFocus,
  onAutoFocused,
  onName,
  onToggleTick,
  onRemove,
  onInsertAfter,
  onDragPointerDown,
  onHandleKeyDown,
}: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const displayName = guest.name.trim() || COPY.fallbackGuestNoun;

  useEffect(() => {
    if (!autoFocus) return;
    nameRef.current?.focus();
    onAutoFocused();
  }, [autoFocus, onAutoFocused]);

  function handleNameKeyDown(event: ReactKeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    // Nothing to chain from an empty row — there's already a blank one here,
    // and without this holding Enter just spawns junk.
    if (!guest.name.trim()) return;
    onInsertAfter(guest.id, guest.isPlusOne);
  }

  return (
    <div
      data-row-id={guest.id}
      data-block-id={blockId}
      data-section-id={sectionId}
      className={`${ROW_GRID_CLASS} rounded-xl transition-opacity ${
        guest.isPlusOne ? PLUS_ONE_INDENT_CLASS : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <DragHandle
        ariaLabel={`Reorder ${displayName}`}
        onPointerDown={(event) =>
          onDragPointerDown(event, guest.id, guest.isPlusOne ? "plus-one" : "guest")
        }
        onKeyDown={(event) => onHandleKeyDown(event, guest.id)}
      />

      <TickBox
        column="confirmed"
        isOn={guest.hasConfirmed}
        guestName={displayName}
        onToggle={() => onToggleTick(guest.id, "hasConfirmed")}
      />
      <TickBox
        column="arrived"
        isOn={guest.hasArrived}
        guestName={displayName}
        onToggle={() => onToggleTick(guest.id, "hasArrived")}
      />

      <div
        className={`flex items-center rounded-xl border bg-white px-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:bg-zinc-950 ${
          guest.isPlusOne
            ? "border-zinc-200 dark:border-zinc-800"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        {guest.isPlusOne && (
          <span className="mr-2 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            +1
          </span>
        )}
        <input
          ref={nameRef}
          type="text"
          value={guest.name}
          onChange={(event) => onName(guest.id, event.target.value)}
          onKeyDown={handleNameKeyDown}
          placeholder={COPY.namePlaceholder}
          aria-label="Guest name"
          className={`w-full min-w-0 bg-transparent py-2.5 text-base outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 sm:text-sm ${
            guest.isPlusOne ? "text-zinc-600 dark:text-zinc-400" : "font-medium"
          }`}
        />
      </div>

      <RemoveButton
        ariaLabel={`Remove ${displayName}`}
        onClick={() => onRemove(guest.id)}
      />
    </div>
  );
}

export default memo(GuestRow);
