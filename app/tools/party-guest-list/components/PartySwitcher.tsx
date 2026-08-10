import { useEffect, useState } from "react";
import { countGuests, type Party } from "@/lib/party-guest-list";
import { COPY } from "../copy";
import { DELETE_CONFIRM_TIMEOUT_MS, MAX_NAME_LENGTH } from "../constants";

type Props = {
  parties: Party[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (name: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
};

/** Chips for every saved party, plus a name field for the active one. Parties
 *  save themselves as you type — there's no Save button to forget. */
export default function PartySwitcher({
  parties,
  activeId,
  onSelect,
  onRename,
  onAdd,
  onDelete,
}: Props) {
  // First tap arms the delete, second confirms — safer than a `confirm()` on
  // a phone, and it un-arms itself if the user moves on.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingDeleteId) return;
    const timer = window.setTimeout(
      () => setPendingDeleteId(null),
      DELETE_CONFIRM_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pendingDeleteId]);

  function handleDelete(id: string) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    setPendingDeleteId(null);
    onDelete(id);
  }

  const activeParty = parties.find((party) => party.id === activeId) ?? null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {COPY.partiesHeading}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        >
          {COPY.newParty}
        </button>
      </div>

      {parties.length > 0 ? (
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {parties.map((party) => {
            const isActive = party.id === activeId;
            const isPendingDelete = pendingDeleteId === party.id;
            return (
              <div
                key={party.id}
                className={`flex flex-shrink-0 items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm transition-colors ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(party.id)}
                  className="max-w-[12rem] truncate font-medium"
                  // No placeholder here: a `title` would become the button's
                  // accessible name and mask the visible "Untitled".
                  title={party.name || undefined}
                >
                  {party.name || "Untitled"}
                  <span className="ml-1.5 tabular-nums opacity-60">
                    {countGuests(party.rows).total}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(party.id)}
                  aria-label={
                    isPendingDelete
                      ? `Confirm deleting ${party.name || "Untitled"}`
                      : `Delete ${party.name || "Untitled"}`
                  }
                  className={`flex h-6 items-center justify-center rounded-full transition-colors ${
                    isPendingDelete
                      ? "bg-rose-500 px-2 text-xs font-semibold text-white"
                      : "w-6 text-zinc-400 hover:bg-black/5 hover:text-rose-500 dark:hover:bg-white/10"
                  }`}
                >
                  {isPendingDelete ? (
                    "Sure?"
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-3 text-sm text-zinc-400">{COPY.noParties}</p>
      )}

      {activeParty && (
        <input
          type="text"
          value={activeParty.name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => onRename(event.target.value)}
          placeholder={COPY.partyNamePlaceholder}
          aria-label="Party name"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
        />
      )}
    </section>
  );
}
