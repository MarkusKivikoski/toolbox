import type { Metadata } from "next";
import Link from "next/link";
import CostOfLiving from "./CostOfLiving";

export const metadata: Metadata = {
  title: "Cost of Living Calculator",
  description:
    "See what a Finnish salary was worth in any year since 1860, adjusted with Statistics Finland's cost-of-living index.",
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
          Enter a net or gross salary and a year, then pick another year to see
          what that money was really worth — Finnish purchasing power adjusted for
          inflation back to 1860.
        </p>
      </header>

      <CostOfLiving />
    </div>
  );
}
