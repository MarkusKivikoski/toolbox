import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createParty, type GuestListState } from "@/lib/party-guest-list";
import { MAX_NAME_LENGTH } from "../constants";

type Params = { setState: Dispatch<SetStateAction<GuestListState>> };

/** Managing the saved parties themselves — create, rename, switch, delete. */
export function usePartyActions({ setState }: Params) {
  const addParty = useCallback(() => {
    // Minted outside the updater so it stays pure — React may call it more than
    // once, and the id must not change between attempts.
    const party = createParty("");
    setState((previous) => ({
      parties: [...previous.parties, party],
      activeId: party.id,
    }));
  }, [setState]);

  const renameActiveParty = useCallback(
    (name: string) =>
      setState((previous) => ({
        ...previous,
        parties: previous.parties.map((party) =>
          party.id === previous.activeId
            ? { ...party, name: name.slice(0, MAX_NAME_LENGTH), updatedAt: Date.now() }
            : party,
        ),
      })),
    [setState],
  );

  const selectParty = useCallback(
    (id: string) => setState((previous) => ({ ...previous, activeId: id })),
    [setState],
  );

  const deleteParty = useCallback(
    (id: string) =>
      setState((previous) => {
        const parties = previous.parties.filter((party) => party.id !== id);
        const activeId =
          previous.activeId === id ? (parties[0]?.id ?? null) : previous.activeId;
        return { parties, activeId };
      }),
    [setState],
  );

  return { addParty, renameActiveParty, selectParty, deleteParty };
}
