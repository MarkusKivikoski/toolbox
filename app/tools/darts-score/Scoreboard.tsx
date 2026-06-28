"use client";

import {
  checkoutLabel,
  checkoutSuggestion,
  dartLabel,
  dartScore,
  OUT_RULE_LABELS,
} from "@/lib/darts";
import type { GameState } from "./DartsTracker";

function formatSummary(game: GameState): string {
  const f = game.format;
  if (f.kind === "single") return "Single leg";
  if (f.kind === "legs") return `First to ${f.legsToWin} legs`;
  return `Best of sets · ${f.legsPerSet} legs/set, ${f.setsToWin} sets`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default function Scoreboard({ game }: { game: GameState }) {
  const showLegs = game.format.kind !== "single";
  const showSets = game.format.kind === "sets";
  const turnScore = game.currentDarts.reduce((sum, d) => sum + dartScore(d), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {game.startScore}
        </span>
        <span>·</span>
        <span>{OUT_RULE_LABELS[game.outRule]}</span>
        <span>·</span>
        <span>{formatSummary(game)}</span>
      </div>

      <div className="space-y-2">
        {game.players.map((p, i) => {
          const place = game.finishOrder.indexOf(i); // 0-based finishing position
          const finished = place >= 0;
          const isChampion = place === 0;
          const active =
            i === game.current && (game.winner === null || game.placesMode) && !finished;
          const dartsLeft = 3 - game.currentDarts.length;
          const suggestion = active
            ? checkoutSuggestion(p.remaining, dartsLeft, game.outRule)
            : null;
          const lastTurn = [...game.turns]
            .reverse()
            .find((t) => t.player === i && t.leg === game.legNumber);

          return (
            <div
              key={p.name}
              className={`rounded-2xl border p-4 transition-colors ${
                isChampion
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40"
                  : finished
                    ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40"
                    : active
                      ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 dark:border-emerald-600 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {active && <span className="text-emerald-500">▸</span>}
                  {finished && (
                    <span className="text-sm font-semibold text-zinc-500">
                      {MEDALS[place] ?? ordinal(place + 1)}
                    </span>
                  )}
                  <span className="text-base font-semibold">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {showSets && (
                    <span>
                      Sets <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{p.sets}</span>
                    </span>
                  )}
                  {showLegs && (
                    <span>
                      Legs <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{p.legs}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 flex items-end justify-between">
                <span className="text-4xl font-bold tabular-nums tracking-tight">
                  {p.remaining}
                </span>
                {active && game.currentDarts.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    this turn{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {turnScore}
                    </span>
                  </span>
                )}
              </div>

              {active && (
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => {
                    const dart = game.currentDarts[d];
                    return (
                      <span
                        key={d}
                        className={`flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-medium ${
                          dart
                            ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
                            : "border border-dashed border-zinc-300 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
                        }`}
                      >
                        {dart ? dartLabel(dart) : "—"}
                      </span>
                    );
                  })}
                </div>
              )}

              {suggestion && (
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  Checkout: <span className="font-semibold">{checkoutLabel(suggestion)}</span>
                </div>
              )}

              {lastTurn && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  <span>Last:</span>
                  {lastTurn.darts.map((d, k) => (
                    <span
                      key={k}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {dartLabel(d)}
                    </span>
                  ))}
                  <span className="font-semibold">
                    {lastTurn.bust ? "Bust" : `(${lastTurn.scored})`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
