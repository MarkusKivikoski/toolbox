"use client";

import { useEffect, useState } from "react";
import {
  applyDart,
  applyLegWin,
  dartScore,
  legStarterIndex,
  type Dart,
  type MatchFormat,
  type OutRule,
} from "@/lib/darts";
import GameSetup from "./GameSetup";
import Scoreboard from "./Scoreboard";
import NumberPad from "./NumberPad";

export type GamePlayer = {
  name: string;
  remaining: number;
  legs: number;
  sets: number;
};

export type TurnRecord = {
  player: number; // index of the thrower
  leg: number; // leg this turn belonged to
  darts: Dart[]; // darts thrown
  scored: number; // points scored (0 on a bust)
  bust: boolean;
};

export type GameState = {
  startScore: number;
  outRule: OutRule;
  format: MatchFormat;
  initialStarter: number;
  players: GamePlayer[];
  legNumber: number; // legs completed so far (drives starter rotation)
  current: number; // index of the player throwing now
  turnStartRemaining: number; // for reverting on a bust
  currentDarts: Dart[]; // darts thrown this turn (max 3)
  turns: TurnRecord[]; // completed turns, in order (for showing previous rounds)
  winner: number | null; // match winner once finished
  finishOrder: number[]; // player indices in the order they checked out (1st, 2nd, …)
  placesMode: boolean; // true while playing on to decide the remaining places
  placesEnded: boolean; // true once the game is fully over (winner only, or all places decided)
  message: string | null; // transient banner (bust / leg / set / match)
};

export type SetupConfig = {
  startScore: number;
  outRule: OutRule;
  format: MatchFormat;
  playerNames: string[];
};

export type SetupDefaults = {
  startScore: number;
  outRule: OutRule;
  format: MatchFormat;
};

const ROSTER_KEY = "toolbox.darts-score.roster.v1";
const GAME_KEY = "toolbox.darts-score.game.v1";
const CONFIG_KEY = "toolbox.darts-score.config.v1";

const DEFAULT_DEFAULTS: SetupDefaults = {
  startScore: 501,
  outRule: "double",
  format: { kind: "single" },
};

const clone = (g: GameState): GameState => JSON.parse(JSON.stringify(g));

// Backfill fields that may be missing from games saved by an older version.
function normalizeGame(g: GameState): GameState {
  return {
    ...g,
    turns: Array.isArray(g.turns) ? g.turns : [],
    finishOrder: Array.isArray(g.finishOrder)
      ? g.finishOrder
      : g.winner !== null && g.winner !== undefined
        ? [g.winner]
        : [],
    placesMode: g.placesMode ?? false,
    placesEnded: g.placesEnded ?? g.winner !== null,
  };
}

export default function DartsTracker() {
  const [roster, setRoster] = useState<string[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [defaults, setDefaults] = useState<SetupDefaults>(DEFAULT_DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state on mount.
  useEffect(() => {
    try {
      const r = localStorage.getItem(ROSTER_KEY);
      if (r) {
        const parsed = JSON.parse(r);
        if (Array.isArray(parsed)) setRoster(parsed);
      }
    } catch {
      /* ignore */
    }
    try {
      const g = localStorage.getItem(GAME_KEY);
      if (g) {
        const parsed = JSON.parse(g);
        if (parsed && Array.isArray(parsed.players)) setGame(normalizeGame(parsed));
      }
    } catch {
      /* ignore */
    }
    try {
      const c = localStorage.getItem(CONFIG_KEY);
      if (c) {
        const parsed = JSON.parse(c);
        if (parsed && parsed.startScore) setDefaults(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    } catch {
      /* ignore */
    }
  }, [roster, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (game) localStorage.setItem(GAME_KEY, JSON.stringify(game));
      else localStorage.removeItem(GAME_KEY);
    } catch {
      /* ignore */
    }
  }, [game, hydrated]);

  function addPlayer(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRoster((r) => (r.some((n) => n.toLowerCase() === trimmed.toLowerCase()) ? r : [...r, trimmed]));
  }

  function removePlayer(name: string) {
    setRoster((r) => r.filter((n) => n !== name));
  }

  function startGame(cfg: SetupConfig) {
    const players: GamePlayer[] = cfg.playerNames.map((name) => ({
      name,
      remaining: cfg.startScore,
      legs: 0,
      sets: 0,
    }));
    setHistory([]);
    setGame({
      startScore: cfg.startScore,
      outRule: cfg.outRule,
      format: cfg.format,
      initialStarter: 0,
      players,
      legNumber: 0,
      current: 0,
      turnStartRemaining: cfg.startScore,
      currentDarts: [],
      turns: [],
      winner: null,
      finishOrder: [],
      placesMode: false,
      placesEnded: false,
      message: null,
    });
    const d: SetupDefaults = {
      startScore: cfg.startScore,
      outRule: cfg.outRule,
      format: cfg.format,
    };
    setDefaults(d);
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(d));
    } catch {
      /* ignore */
    }
  }

  function nextActiveIndex(g: GameState, from: number): number {
    const n = g.players.length;
    for (let step = 1; step <= n; step++) {
      const idx = (from + step) % n;
      if (!g.finishOrder.includes(idx)) return idx;
    }
    return from;
  }

  function endTurn(g: GameState) {
    g.current = nextActiveIndex(g, g.current);
    g.currentDarts = [];
    g.turnStartRemaining = g.players[g.current].remaining;
  }

  function unfinished(g: GameState): number[] {
    return g.players.map((_, i) => i).filter((i) => !g.finishOrder.includes(i));
  }

  // A player checked out while playing on for places.
  function recordPlace(g: GameState, idx: number) {
    g.finishOrder.push(idx);
    const left = unfinished(g);
    if (left.length <= 1) {
      if (left.length === 1) g.finishOrder.push(left[0]); // last place is decided
      g.placesMode = false;
      g.placesEnded = true;
      g.currentDarts = [];
      g.message = "Final standings decided!";
      return;
    }
    g.message = `${g.players[idx].name} finishes #${g.finishOrder.length}`;
    g.current = nextActiveIndex(g, idx);
    g.currentDarts = [];
    g.turnStartRemaining = g.players[g.current].remaining;
  }

  function handleLegWin(g: GameState) {
    const winnerIdx = g.current;
    const standings = g.players.map((p) => ({ legs: p.legs, sets: p.sets }));
    const result = applyLegWin(standings, winnerIdx, g.format);
    g.players.forEach((p, i) => {
      p.legs = result.standings[i].legs;
      p.sets = result.standings[i].sets;
    });

    if (result.matchOver) {
      g.winner = winnerIdx;
      g.finishOrder = [winnerIdx];
      g.currentDarts = [];
      const left = unfinished(g);
      if (left.length <= 1) {
        // Only one player left — the order is already settled, no point playing on.
        if (left.length === 1) g.finishOrder.push(left[0]);
        g.placesEnded = true;
        g.message = `🏆 ${g.players[winnerIdx].name} wins!`;
      } else {
        g.message = `🏆 ${g.players[winnerIdx].name} wins! Play on for places?`;
      }
      return;
    }

    g.legNumber += 1;
    g.players.forEach((p) => (p.remaining = g.startScore));
    g.current = legStarterIndex(g.initialStarter, g.legNumber, g.players.length);
    g.currentDarts = [];
    g.turnStartRemaining = g.startScore;
    g.message = result.setWon
      ? `${g.players[winnerIdx].name} takes the set!`
      : `${g.players[winnerIdx].name} wins the leg!`;
  }

  // Log the current turn before its darts are cleared, so it shows as "last round".
  function recordTurn(g: GameState, bust: boolean) {
    g.turns.push({
      player: g.current,
      leg: g.legNumber,
      darts: [...g.currentDarts],
      scored: bust ? 0 : g.currentDarts.reduce((s, d) => s + dartScore(d), 0),
      bust,
    });
  }

  function throwDart(dart: Dart) {
    if (!game) return;
    // Block input once the match is decided, unless we're playing on for places.
    if (game.winner !== null && !game.placesMode) return;
    const snapshot = game;
    const next = clone(game);
    next.message = null;
    const player = next.players[next.current];
    const res = applyDart(player.remaining, dart, next.outRule);
    next.currentDarts.push(dart);

    if (res.kind === "ok") {
      player.remaining = res.remaining;
      if (next.currentDarts.length >= 3) {
        recordTurn(next, false);
        endTurn(next);
      }
    } else if (res.kind === "bust") {
      player.remaining = next.turnStartRemaining;
      next.message = `${player.name} bust — back to ${next.turnStartRemaining}`;
      recordTurn(next, true);
      endTurn(next);
    } else {
      player.remaining = 0;
      recordTurn(next, false);
      if (next.placesMode) recordPlace(next, next.current);
      else handleLegWin(next);
    }

    setHistory((h) => [...h, snapshot]);
    setGame(next);
  }

  function playOnForPlaces() {
    if (!game || game.winner === null) return;
    setHistory((h) => [...h, game]);
    const next = clone(game);
    next.placesMode = true;
    next.current = nextActiveIndex(next, next.winner!);
    next.currentDarts = [];
    next.turnStartRemaining = next.players[next.current].remaining;
    next.message = "Playing on for places — keep throwing!";
    setGame(next);
  }

  function endNow() {
    if (!game) return;
    const next = clone(game);
    next.placesMode = false;
    next.placesEnded = true;
    setGame(next);
  }

  function undo() {
    if (history.length === 0) return;
    setGame(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  function endGame() {
    setGame(null);
    setHistory([]);
  }

  function confirmEndGame() {
    if (
      window.confirm("End the game now? The current scores will be lost.")
    ) {
      endGame();
    }
  }

  function rematch() {
    if (!game) return;
    startGame({
      startScore: game.startScore,
      outRule: game.outRule,
      format: game.format,
      playerNames: game.players.map((p) => p.name),
    });
  }

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  if (!game) {
    return (
      <GameSetup
        roster={roster}
        defaults={defaults}
        onAddPlayer={addPlayer}
        onRemovePlayer={removePlayer}
        onStart={startGame}
      />
    );
  }

  const won = game.winner !== null;
  const decisionPending = won && !game.placesMode && !game.placesEnded;
  const stillPlaying = !won || game.placesMode;

  return (
    <div className="space-y-5">
      {game.message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            game.message.includes("bust")
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              : won
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200"
          }`}
        >
          {game.message}
        </div>
      )}

      <Scoreboard game={game} />

      {game.placesEnded ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={rematch}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Rematch
          </button>
          <button
            onClick={endGame}
            className="flex-1 rounded-xl border border-zinc-300 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            New game
          </button>
        </div>
      ) : decisionPending ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={playOnForPlaces}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Play on for places
            </button>
            <button
              onClick={endNow}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              End game
            </button>
          </div>
          {history.length > 0 && (
            <button
              onClick={undo}
              className="w-full rounded-xl border border-amber-300 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              ↶ Undo last dart
            </button>
          )}
        </div>
      ) : stillPlaying ? (
        <>
          <NumberPad onDart={throwDart} onUndo={undo} canUndo={history.length > 0} />
          <button
            onClick={game.placesMode ? endNow : confirmEndGame}
            className="w-full rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            {game.placesMode ? "Stop & show final standings" : "End game"}
          </button>
        </>
      ) : null}
    </div>
  );
}
