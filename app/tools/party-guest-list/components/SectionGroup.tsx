import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Guest, RowGroup } from "@/lib/party-guest-list";
import { COPY } from "../copy";
import { SECTION_SPACING_CLASS } from "../constants";
import HeadingRow from "./HeadingRow";
import GuestRow from "./GuestRow";
import AddRowButton from "./AddRowButton";
import type { TickField } from "../hooks/useGuestListActions";
import type { DragKind } from "../hooks/useGuestDragReorder";

type Props = {
  group: RowGroup;
  dragId: string | null;
  focusRowId: string | null;
  onAutoFocused: () => void;
  onLabel: (id: string, value: string) => void;
  onToggleTick: (id: string, field: TickField) => void;
  onRemove: (id: string) => void;
  onInsertAfter: (id: string, isPlusOne: boolean) => void;
  onDragPointerDown: (event: ReactPointerEvent, id: string, kind: DragKind) => void;
  onHandleKeyDown: (event: ReactKeyboardEvent, id: string) => void;
  onAddGuest: (headingId: string | null) => void;
};

/** Tag each guest with the main guest it travels with, so the drag hook can
 *  exclude a whole block from its midpoint measurements. A plus-one can never
 *  follow a heading, so blocks never span sections. */
function blockIdsOf(guests: Guest[]): string[] {
  let currentBlockId = "";
  return guests.map((guest) => {
    if (!guest.isPlusOne) currentBlockId = guest.id;
    return currentBlockId;
  });
}

/** One section — its heading (if any), its guests, and its own add button. */
export default function SectionGroup({
  group,
  dragId,
  focusRowId,
  onAutoFocused,
  onLabel,
  onToggleTick,
  onRemove,
  onInsertAfter,
  onDragPointerDown,
  onHandleKeyDown,
  onAddGuest,
}: Props) {
  const sectionId = group.heading?.id ?? "";
  const blockIds = blockIdsOf(group.guests);

  return (
    <div className={SECTION_SPACING_CLASS}>
      {group.heading && (
        <HeadingRow
          heading={group.heading}
          isDragging={dragId === group.heading.id}
          autoFocus={focusRowId === group.heading.id}
          onAutoFocused={onAutoFocused}
          onTitle={onLabel}
          onRemove={onRemove}
          onInsertAfter={onInsertAfter}
          onDragPointerDown={onDragPointerDown}
          onHandleKeyDown={onHandleKeyDown}
        />
      )}

      <div className="mt-2 space-y-2">
        {group.guests.map((guest, index) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            blockId={blockIds[index]}
            sectionId={sectionId}
            isDragging={dragId === guest.id}
            autoFocus={focusRowId === guest.id}
            onAutoFocused={onAutoFocused}
            onName={onLabel}
            onToggleTick={onToggleTick}
            onRemove={onRemove}
            onInsertAfter={onInsertAfter}
            onDragPointerDown={onDragPointerDown}
            onHandleKeyDown={onHandleKeyDown}
          />
        ))}
      </div>

      {group.guests.length === 0 && group.heading && (
        <p className="mt-2 text-sm text-zinc-400">{COPY.emptySection}</p>
      )}

      <div className="mt-2">
        <AddRowButton
          label={COPY.addGuest}
          onClick={() => onAddGuest(group.heading?.id ?? null)}
        />
      </div>
    </div>
  );
}
