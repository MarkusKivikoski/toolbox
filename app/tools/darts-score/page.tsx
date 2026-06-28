import type { Metadata } from "next";
import Link from "next/link";
import DartsTracker from "./DartsTracker";

export const metadata: Metadata = {
  title: "Darts Score Tracker",
  description:
    "Track X01 darts games — pick players, enforce official out-rules, and get checkout suggestions.",
};

export default function DartsScorePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">Darts Score Tracker</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          🎯 Darts Score Tracker
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Score an X01 game throw by throw. Pick your players, choose the
          finishing rule, and let it handle busts, checkouts and the running
          total.
        </p>
      </header>

      <DartsTracker />
    </div>
  );
}
