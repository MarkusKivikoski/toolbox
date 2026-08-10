import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  appendGuestToSection,
  createGuest,
  createHeading,
  createParty,
  insertRowAfter,
  isGuest,
  moveRowBlock,
  removeRow,
  setGuestIndent,
  type GuestListState,
  type ListRow,
  type Party,
} from "@/lib/party-guest-list";
import { capitalizeFirst } from "@/lib/utils";
import { DEFAULT_PARTY_NAME } from "../copy";
import { MAX_NAME_LENGTH } from "../constants";

/** Which of a guest's two ticks an action targets. */
export type TickField = "hasConfirmed" | "hasArrived";

type Params = {
  setState: Dispatch<SetStateAction<GuestListState>>;
  setFocusRowId: Dispatch<SetStateAction<string | null>>;
};

const withParty = (
  state: GuestListState,
  index: number,
  party: Party,
): GuestListState => {
  const parties = state.parties.slice();
  parties[index] = { ...party, updatedAt: Date.now() };
  return { ...state, parties };
};

/**
 * Every write against the active party's list — guest and heading CRUD, ticks,
 * and the results of a drag. The orchestrator stays pure wiring.
 */
export function useGuestListActions({ setState, setFocusRowId }: Params) {
  const patchActiveParty = useCallback(
    (update: (party: Party) => Party | null) =>
      setState((previous) => {
        const index = previous.parties.findIndex(
          (party) => party.id === previous.activeId,
        );
        if (index === -1) return previous;
        const updated = update(previous.parties[index]);
        return updated ? withParty(previous, index, updated) : previous;
      }),
    [setState],
  );

  // The list helpers return `null` for a no-op, which we pass straight through
  // so an unchanged drag frame never triggers a write.
  const patchRows = useCallback(
    (update: (rows: ListRow[]) => ListRow[] | null) =>
      patchActiveParty((party) => {
        const rows = update(party.rows);
        return rows ? { ...party, rows } : null;
      }),
    [patchActiveParty],
  );

  /**
   * Add a row and focus it. With no party yet, the first add quietly starts
   * one — clicking "+ Add guest" on a blank page should just work.
   */
  const addRow = useCallback(
    (row: ListRow, place: (rows: ListRow[]) => ListRow[] | null) => {
      // Minted outside the updater so it stays pure — React may call it more
      // than once, and ids must not change between attempts.
      const firstParty = createParty(DEFAULT_PARTY_NAME);
      setState((previous) => {
        const index = previous.parties.findIndex(
          (party) => party.id === previous.activeId,
        );
        if (index === -1) {
          const party = { ...firstParty, rows: [row] };
          return { parties: [...previous.parties, party], activeId: party.id };
        }
        const party = previous.parties[index];
        const rows = place(party.rows);
        return rows ? withParty(previous, index, { ...party, rows }) : previous;
      });
      setFocusRowId(row.id); // focus the new row's input once it renders
    },
    [setState, setFocusRowId],
  );

  const addGuest = useCallback(
    (headingId: string | null) => {
      const guest = createGuest();
      addRow(guest, (rows) => appendGuestToSection(rows, headingId, guest));
    },
    [addRow],
  );

  const addHeading = useCallback(() => {
    const heading = createHeading();
    addRow(heading, (rows) => [...rows, heading]);
  }, [addRow]);

  /** Enter on a row: open a fresh guest directly below it. */
  const insertGuestAfter = useCallback(
    (afterId: string, isPlusOne: boolean) => {
      const guest = createGuest(isPlusOne);
      patchRows((rows) => insertRowAfter(rows, afterId, guest));
      setFocusRowId(guest.id);
    },
    [patchRows, setFocusRowId],
  );

  const updateRowLabel = useCallback(
    (id: string, value: string) =>
      patchRows((rows) =>
        rows.map((row) => {
          if (row.id !== id) return row;
          const label = capitalizeFirst(value).slice(0, MAX_NAME_LENGTH);
          return isGuest(row) ? { ...row, name: label } : { ...row, title: label };
        }),
      ),
    [patchRows],
  );

  const toggleGuestTick = useCallback(
    (id: string, field: TickField) =>
      patchRows((rows) =>
        rows.map((row) =>
          row.id === id && isGuest(row) ? { ...row, [field]: !row[field] } : row,
        ),
      ),
    [patchRows],
  );

  const deleteRow = useCallback(
    (id: string) => patchRows((rows) => removeRow(rows, id)),
    [patchRows],
  );

  // Stable so the drag hook doesn't re-bind its window listeners mid-drag.
  const moveRow = useCallback(
    (id: string, targetIndex: number) =>
      patchRows((rows) => moveRowBlock(rows, id, targetIndex)),
    [patchRows],
  );

  const indentGuest = useCallback(
    (id: string, shouldBePlusOne: boolean) =>
      patchRows((rows) => setGuestIndent(rows, id, shouldBePlusOne)),
    [patchRows],
  );

  return {
    addGuest,
    insertGuestAfter,
    addHeading,
    updateRowLabel,
    toggleGuestTick,
    deleteRow,
    moveRow,
    indentGuest,
  };
}
