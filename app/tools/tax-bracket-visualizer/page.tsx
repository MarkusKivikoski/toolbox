import type { Metadata } from "next";
import Link from "next/link";
import TaxBracketVisualizer from "./TaxBracketVisualizer";

export const metadata: Metadata = {
  title: "Tax Bracket Visualizer",
  description:
    "See how Finnish 2026 income tax eats a gross salary — progressive brackets, net pay, and your marginal rate on the next euro.",
};

export default function TaxBracketVisualizerPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">Tax Bracket Visualizer</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          🧾 Tax Bracket Visualizer
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Drag a gross salary and watch how Finland&apos;s 2026 progressive tax
          brackets carve it up — what you actually take home, and how much of
          the next euro (or the next raise) the taxman keeps.
        </p>
      </header>

      <TaxBracketVisualizer />
    </div>
  );
}
