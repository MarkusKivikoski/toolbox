import type { Metadata } from "next";
import Link from "next/link";
import CostOfLiving from "./CostOfLiving";

export const metadata: Metadata = {
  title: "Cost of Living Calculator",
  description:
    "Compare a Finnish salary across two years and see whether your pay kept up with inflation, using Statistics Finland's cost-of-living index.",
};

export default function CostOfLivingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">Cost of Living Calculator</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          💶 Cost of Living Calculator
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Enter what you earned in two different years and see whether your pay
          kept up — what your salary should be today to match, and how much your
          buying power has risen or fallen. Finnish data back to 1860.
        </p>
      </header>

      <CostOfLiving />
    </div>
  );
}
