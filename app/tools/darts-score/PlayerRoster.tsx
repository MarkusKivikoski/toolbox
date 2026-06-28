"use client";

import { useState } from "react";

export default function PlayerRoster({
  roster,
  selected,
  onToggle,
  onAdd,
  onRemove,
}: {
  roster: string[];
  selected: string[];
  onToggle: (name: string) => void;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          placeholder="Add a player…"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          onClick={submit}
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Add
        </button>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No saved players yet — add the people you usually play with.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {roster.map((player) => {
            const active = selected.includes(player);
            return (
              <span
                key={player}
                className={`inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-1.5 text-sm transition-colors ${
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                }`}
              >
                <button onClick={() => onToggle(player)} className="font-medium">
                  {active ? "✓ " : ""}
                  {player}
                </button>
                <button
                  onClick={() => onRemove(player)}
                  aria-label={`Remove ${player} from roster`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
