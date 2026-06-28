// Pure X01 darts game engine — no React, fully unit-testable.

export type OutRule = "double" | "single" | "master";

/** A single dart. `value` is 0 (miss), 1–20, or 25 (bull). `mult` is the ring. */
export type Dart = { value: number; mult: 1 | 2 | 3 };

export type MatchFormat =
  | { kind: "single" }
  | { kind: "legs"; legsToWin: number }
  | { kind: "sets"; legsPerSet: number; setsToWin: number };

export const DEFAULT_START_SCORES = [501, 401, 301, 201];

/** Highest score that can be checked out in a single turn (T20 T20 Bull). */
export const MAX_CHECKOUT = 170;

export const OUT_RULE_LABELS: Record<OutRule, string> = {
  double: "Double out",
  single: "Single out",
  master: "Master out",
};

export function dartScore(d: Dart): number {
  return d.value * d.mult;
}

/** Rejects impossible darts (e.g. triple bull, doubled miss, out-of-range values). */
export function isValidDart(d: Dart): boolean {
  if (d.value === 0) return d.mult === 1; // a miss has no multiplier
  if (d.value === 25) return d.mult === 1 || d.mult === 2; // bull: 25 or 50, never tripled
  return d.value >= 1 && d.value <= 20 && (d.mult === 1 || d.mult === 2 || d.mult === 3);
}

/** Whether a dart can legally close out a leg under the given rule. */
export function isFinishingDart(d: Dart, outRule: OutRule): boolean {
  if (d.value === 0) return false;
  switch (outRule) {
    case "single":
      return true;
    case "double":
      return d.mult === 2; // includes the bullseye (25×2 = 50)
    case "master":
      return d.mult === 2 || d.mult === 3;
  }
}

export type DartResult = { kind: "ok" | "win" | "bust"; remaining: number };

/**
 * Apply one dart to a remaining score. On a bust the returned `remaining` is the
 * pre-dart value; the caller is responsible for reverting to the start of the turn.
 */
export function applyDart(remaining: number, dart: Dart, outRule: OutRule): DartResult {
  const next = remaining - dartScore(dart);
  if (next === 0) {
    return isFinishingDart(dart, outRule)
      ? { kind: "win", remaining: 0 }
      : { kind: "bust", remaining };
  }
  if (next < 0) return { kind: "bust", remaining };
  // Can't leave 1 when a double (or triple) is required to finish.
  if (next === 1 && outRule !== "single") return { kind: "bust", remaining };
  return { kind: "ok", remaining: next };
}

/** Fold a whole turn (up to 3 darts) onto a starting score. Convenience for tests. */
export function applyTurn(
  startRemaining: number,
  darts: Dart[],
  outRule: OutRule,
): DartResult {
  let remaining = startRemaining;
  for (const d of darts) {
    const r = applyDart(remaining, d, outRule);
    if (r.kind === "bust") return { kind: "bust", remaining: startRemaining };
    if (r.kind === "win") return { kind: "win", remaining: 0 };
    remaining = r.remaining;
  }
  return { kind: "ok", remaining };
}

/** All scoring segments, ordered so high scorers come first (good suggestions). */
function allSegments(): Dart[] {
  const segs: Dart[] = [];
  for (let v = 20; v >= 1; v--) {
    segs.push({ value: v, mult: 3 });
    segs.push({ value: v, mult: 2 });
    segs.push({ value: v, mult: 1 });
  }
  segs.push({ value: 25, mult: 2 }); // bull 50
  segs.push({ value: 25, mult: 1 }); // 25
  return segs;
}

/**
 * Find a finishing combination for `remaining` using at most `dartsLeft` darts,
 * legal under `outRule`. Returns the shortest combo found, or null if none exists.
 */
export function checkoutSuggestion(
  remaining: number,
  dartsLeft: number,
  outRule: OutRule,
): Dart[] | null {
  if (remaining <= 0 || remaining > MAX_CHECKOUT) return null;
  const segs = allSegments();
  const finishers = segs.filter((d) => isFinishingDart(d, outRule));

  // 1 dart
  for (const f of finishers) {
    if (dartScore(f) === remaining) return [f];
  }
  // 2 darts
  if (dartsLeft >= 2) {
    for (const a of segs) {
      const rem = remaining - dartScore(a);
      if (rem <= 0) continue;
      for (const f of finishers) {
        if (dartScore(f) === rem) return [a, f];
      }
    }
  }
  // 3 darts
  if (dartsLeft >= 3) {
    for (const a of segs) {
      const rem1 = remaining - dartScore(a);
      if (rem1 <= 0) continue;
      for (const b of segs) {
        const rem2 = rem1 - dartScore(b);
        if (rem2 <= 0) continue;
        for (const f of finishers) {
          if (dartScore(f) === rem2) return [a, b, f];
        }
      }
    }
  }
  return null;
}

export function dartLabel(d: Dart): string {
  if (d.value === 0) return "Miss";
  if (d.value === 25) return d.mult === 2 ? "Bull" : "25";
  const prefix = d.mult === 3 ? "T" : d.mult === 2 ? "D" : "";
  return `${prefix}${d.value}`;
}

export function checkoutLabel(darts: Dart[]): string {
  return darts.map(dartLabel).join(" ");
}

export type Standing = { legs: number; sets: number };

export type LegWinResult = {
  standings: Standing[];
  setWon: boolean;
  matchOver: boolean;
};

/** Update standings after a leg is won and report whether a set/match ended. */
export function applyLegWin(
  standings: Standing[],
  winnerIdx: number,
  format: MatchFormat,
): LegWinResult {
  const next = standings.map((s) => ({ ...s }));
  next[winnerIdx].legs += 1;
  let setWon = false;
  let matchOver = false;

  if (format.kind === "single") {
    matchOver = true;
  } else if (format.kind === "legs") {
    matchOver = next[winnerIdx].legs >= format.legsToWin;
  } else {
    if (next[winnerIdx].legs >= format.legsPerSet) {
      setWon = true;
      next.forEach((s) => (s.legs = 0));
      next[winnerIdx].sets += 1;
      matchOver = next[winnerIdx].sets >= format.setsToWin;
    }
  }
  return { standings: next, setWon, matchOver };
}

/** Index of the player who throws first in a given (zero-based) leg number. */
export function legStarterIndex(
  initialStarter: number,
  legNumber: number,
  playerCount: number,
): number {
  return (initialStarter + legNumber) % playerCount;
}
