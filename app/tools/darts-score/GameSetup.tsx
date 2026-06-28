"use client";

import { useState } from "react";
import {
  DEFAULT_START_SCORES,
  OUT_RULE_LABELS,
  type MatchFormat,
  type OutRule,
} from "@/lib/darts";
import type { SetupConfig, SetupDefaults } from "./DartsTracker";
import PlayerRoster from "./PlayerRoster";

const OUT_RULES: OutRule[] = ["double", "single", "master"];
type FormatKind = MatchFormat["kind"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-emerald-500 bg-emerald-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function NumberStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="inline-flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-lg dark:border-zinc-700"
        >
          −
        </button>
        <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-lg dark:border-zinc-700"
        >
          +
        </button>
      </span>
    </label>
  );
}

export default function GameSetup({
  roster,
  defaults,
  onAddPlayer,
  onRemovePlayer,
  onStart,
}: {
  roster: string[];
  defaults: SetupDefaults;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (name: string) => void;
  onStart: (cfg: SetupConfig) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [startScore, setStartScore] = useState(defaults.startScore);
  const [customScore, setCustomScore] = useState("");
  const [outRule, setOutRule] = useState<OutRule>(defaults.outRule);
  const [formatKind, setFormatKind] = useState<FormatKind>(defaults.format.kind);
  const [legsToWin, setLegsToWin] = useState(
    defaults.format.kind === "legs" ? defaults.format.legsToWin : 3,
  );
  const [legsPerSet, setLegsPerSet] = useState(
    defaults.format.kind === "sets" ? defaults.format.legsPerSet : 3,
  );
  const [setsToWin, setSetsToWin] = useState(
    defaults.format.kind === "sets" ? defaults.format.setsToWin : 3,
  );

  // Keep selection in sync with the roster (a removed player drops out).
  const order = selected.filter((n) => roster.includes(n));

  function toggle(name: string) {
    setSelected((s) =>
      s.includes(name) ? s.filter((n) => n !== name) : [...s, name],
    );
  }

  function move(index: number, dir: -1 | 1) {
    setSelected((s) => {
      const cur = s.filter((n) => roster.includes(n));
      const j = index + dir;
      if (j < 0 || j >= cur.length) return s;
      const copy = [...cur];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  }

  function randomize() {
    setSelected((s) => {
      const cur = s.filter((n) => roster.includes(n));
      for (let i = cur.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cur[i], cur[j]] = [cur[j], cur[i]];
      }
      return cur;
    });
  }

  function buildFormat(): MatchFormat {
    if (formatKind === "legs") return { kind: "legs", legsToWin };
    if (formatKind === "sets") return { kind: "sets", legsPerSet, setsToWin };
    return { kind: "single" };
  }

  function start() {
    if (order.length === 0) return;
    onStart({
      startScore,
      outRule,
      format: buildFormat(),
      playerNames: order,
    });
  }

  return (
    <div className="space-y-4">
      <Section title="Players">
        <PlayerRoster
          roster={roster}
          selected={order}
          onToggle={toggle}
          onAdd={onAddPlayer}
          onRemove={onRemovePlayer}
        />

        {order.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Throwing order
              </span>
              <button
                onClick={randomize}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                🎲 Randomize
              </button>
            </div>
            <ol className="space-y-1.5">
              {order.map((p, i) => (
                <li
                  key={p}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <span className="w-5 font-semibold tabular-nums text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{p}</span>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 disabled:opacity-30 dark:border-zinc-700"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 disabled:opacity-30 dark:border-zinc-700"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Section>

      <Section title="Starting score">
        <div className="flex flex-wrap gap-2">
          {DEFAULT_START_SCORES.map((s) => (
            <Chip
              key={s}
              active={startScore === s && customScore === ""}
              onClick={() => {
                setStartScore(s);
                setCustomScore("");
              }}
            >
              {s}
            </Chip>
          ))}
          <input
            type="text"
            inputMode="numeric"
            value={customScore}
            placeholder="Custom"
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setCustomScore(raw);
              const n = parseInt(raw, 10);
              if (Number.isFinite(n) && n > 0) setStartScore(n);
            }}
            className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </Section>

      <Section title="Finishing rule">
        <div className="flex flex-wrap gap-2">
          {OUT_RULES.map((r) => (
            <Chip key={r} active={outRule === r} onClick={() => setOutRule(r)}>
              {OUT_RULE_LABELS[r]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {outRule === "double" &&
            "Must finish on a double (the bullseye counts as a double)."}
          {outRule === "single" && "Finish on any throw that lands exactly on zero."}
          {outRule === "master" && "Finish on a double or a triple."}
        </p>
      </Section>

      <Section title="Match format">
        <div className="flex flex-wrap gap-2">
          <Chip active={formatKind === "single"} onClick={() => setFormatKind("single")}>
            Single leg
          </Chip>
          <Chip active={formatKind === "legs"} onClick={() => setFormatKind("legs")}>
            First to N legs
          </Chip>
          <Chip active={formatKind === "sets"} onClick={() => setFormatKind("sets")}>
            Legs &amp; sets
          </Chip>
        </div>
        <div className="mt-3 space-y-2">
          {formatKind === "legs" && (
            <NumberStepper
              label="Legs to win the match"
              value={legsToWin}
              min={1}
              onChange={setLegsToWin}
            />
          )}
          {formatKind === "sets" && (
            <>
              <NumberStepper
                label="Legs to win a set"
                value={legsPerSet}
                min={1}
                onChange={setLegsPerSet}
              />
              <NumberStepper
                label="Sets to win the match"
                value={setsToWin}
                min={1}
                onChange={setSetsToWin}
              />
            </>
          )}
        </div>
      </Section>

      <button
        onClick={start}
        disabled={order.length === 0}
        className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
      >
        {order.length === 0
          ? "Select at least one player"
          : `Start game · ${order.length} player${order.length > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
