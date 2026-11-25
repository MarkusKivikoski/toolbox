import { useCallback, useState } from "react";
import type { SpendingEntry } from "@/lib/budgetSpending";
import { SPENDING_COPY } from "../copy";
import type { SpendingActions } from "../hooks/useSpendingActions";
import AddButton from "./AddButton";
import RowEditor from "./RowEditor";

type Props = {
  /** DOM id, so the row's toggle button can point at this panel. */
  id: string;
  sectionId: string;
  sectionName: string;
  entries: SpendingEntry[];
  actions: SpendingActions;
};

/** The expanded drawer under a legend row: the section's purchases, editable. */
export default function SpendingPanel({
  id,
  sectionId,
  sectionName,
  entries,
  actions,
}: Props) {
  const [focusEntryId, setFocusEntryId] = useState<string | null>(null);
  const clearFocusEntry = useCallback(() => setFocusEntryId(null), []);

  // Focus the new entry's name field so a purchase can be typed straight in.
  const handleAdd = () => setFocusEntryId(actions.addEntry(sectionId));

  return (
    <div
      id={id}
      className="mx-2 mb-1.5 mt-0.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-2 dark:border-zinc-800 dark:bg-zinc-950/40"
    >
      {entries.length === 0 && (
        <p className="px-2 py-2 text-center text-xs text-zinc-400">{SPENDING_COPY.empty}</p>
      )}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <RowEditor
            key={entry.id}
            row={entry}
            ariaPrefix={SPENDING_COPY.entry(sectionName, index + 1)}
            namePlaceholder={SPENDING_COPY.namePlaceholder}
            fallbackNoun={SPENDING_COPY.fallbackNoun}
            showDot={false}
            autoFocus={entry.id === focusEntryId}
            onAutoFocused={clearFocusEntry}
            onName={(value) => actions.updateEntry(sectionId, entry.id, { name: value })}
            onAmount={(value) => actions.updateEntry(sectionId, entry.id, { amount: value })}
            onRemove={() => actions.removeEntry(sectionId, entry.id)}
          />
        ))}
      </div>
      <AddButton label={SPENDING_COPY.add} onClick={handleAdd} />
    </div>
  );
}
