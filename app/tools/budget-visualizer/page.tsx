import type { Metadata } from "next";
import Link from "next/link";
import BudgetVisualizer from "./BudgetVisualizer";

export const metadata: Metadata = {
  title: "Budget Visualizer",
  description:
    "Split your monthly income into spending sections and see the breakdown as a doughnut chart, with what's left to budget in the middle.",
};

export default function BudgetVisualizerPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href="/"
          className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          Budget Visualizer
        </span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          🍩 Budget Visualizer
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Enter your monthly income and break it into spending sections — add or
          remove as many as you like. The doughnut shows where it all goes, with
          your total in the middle and whatever&apos;s left over as its own slice.
        </p>
      </header>

      <BudgetVisualizer />
    </div>
  );
}
