"use client";

import { useCallback, useMemo, useState } from "react";
import { countGuests, type ListRow } from "@/lib/party-guest-list";
import { COPY } from "./copy";
import { usePersistedGuestListState } from "./hooks/usePersistedGuestListState";
import { useGuestListActions } from "./hooks/useGuestListActions";
import { usePartyActions } from "./hooks/usePartyActions";
import { useGuestDragReorder } from "./hooks/useGuestDragReorder";
import GuestCounter from "./components/GuestCounter";
import GuestList from "./components/GuestList";
import PartySwitcher from "./components/PartySwitcher";

// Module-level so the "no party yet" case keeps a stable identity for useMemo.
const NO_ROWS: ListRow[] = [];

export default function PartyGuestList() {
  const { state, setState, hydrated } = usePersistedGuestListState();
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const clearFocusRow = useCallback(() => setFocusRowId(null), []);

  const {
    addGuest,
    insertGuestAfter,
    addHeading,
    updateRowLabel,
    toggleGuestTick,
    deleteRow,
    moveRow,
    indentGuest,
  } = useGuestListActions({ setState, setFocusRowId });

  const { addParty, renameActiveParty, selectParty, deleteParty } = usePartyActions({
    setState,
  });

  const { listRef, dragId, startDrag } = useGuestDragReorder({
    onMove: moveRow,
    onIndentChange: indentGuest,
  });

  const activeParty =
    state.parties.find((party) => party.id === state.activeId) ?? null;
  const rows = activeParty?.rows ?? NO_ROWS;
  const counts = useMemo(() => countGuests(rows), [rows]);

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <GuestCounter counts={counts} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <GuestList
          rows={rows}
          listRef={listRef}
          dragId={dragId}
          focusRowId={focusRowId}
          onAutoFocused={clearFocusRow}
          onLabel={updateRowLabel}
          onToggleTick={toggleGuestTick}
          onRemove={deleteRow}
          onInsertAfter={insertGuestAfter}
          onDragPointerDown={startDrag}
          onMove={moveRow}
          onIndent={indentGuest}
          onAddGuest={addGuest}
          onAddSection={addHeading}
        />
      </div>

      <PartySwitcher
        parties={state.parties}
        activeId={state.activeId}
        onSelect={selectParty}
        onRename={renameActiveParty}
        onAdd={addParty}
        onDelete={deleteParty}
      />

      <p className="px-1 text-xs leading-relaxed text-zinc-400">{COPY.privacyNote}</p>
    </div>
  );
}
