"use client";

import { useState } from "react";
import type { Dart } from "@/lib/darts";

type Mult = 1 | 2 | 3;

export default function NumberPad({
  onDart,
  onUndo,
  canUndo,
}: {
  onDart: (dart: Dart) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [mult, setMult] = useState<Mult>(1);

  function play(value: number, m: Mult) {
    onDart({ value, mult: m });
    setMult(1); // reset to single after each dart
  }

  function toggle(m: Mult) {
    setMult((cur) => (cur === m ? 1 : m));
  }

  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          onClick={() => toggle(2)}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            mult === 2
              ? "bg-violet-600 text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          Double
        </button>
        <button
          onClick={() => toggle(3)}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            mult === 3
              ? "bg-violet-600 text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          Triple
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => play(n, mult)}
            className="flex h-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-base font-semibold tabular-nums transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          >
            {mult === 2 ? "D" : mult === 3 ? "T" : ""}
            {n}
          </button>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => play(0, 1)}
          className="flex h-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-semibold transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Miss
        </button>
        <button
          onClick={() => play(25, mult === 3 ? 1 : mult)}
          disabled={mult === 3}
          className="flex h-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-semibold transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
        >
          {mult === 2 ? "Bull 50" : "25"}
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex h-12 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-30 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          ↶ Undo
        </button>
      </div>
    </div>
  );
}
