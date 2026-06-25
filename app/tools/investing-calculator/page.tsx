import type { Metadata } from "next";
import Link from "next/link";
import InvestingCalculator from "./InvestingCalculator";

export const metadata: Metadata = {
  title: "Investing Calculator",
  description:
    "Project your investments with variable monthly contributions and model retirement withdrawals.",
};

export default function InvestingCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          Investing Calculator
        </span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          📈 Investing Calculator
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          See how your portfolio grows when your monthly contributions change
          over time — then model drawing it down once you retire.
        </p>
      </header>

      <InvestingCalculator />
    </div>
  );
}
