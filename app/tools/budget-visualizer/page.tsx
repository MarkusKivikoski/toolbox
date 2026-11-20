import type { Metadata } from "next";
import Link from "next/link";
import BudgetVisualizer from "./BudgetVisualizer";

export const metadata: Metadata = {
  title: "Budjettinäkymä",
  description:
    "Jaa kuukausibudjetti tai matkan kulut kehädiagrammille ja seuraa säästötavoitetta — keskellä näkyy, mitä jää jäljelle.",
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
        <span className="text-zinc-700 dark:text-zinc-300">Budjettinäkymä</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          🍩 Budjettidiagrammi
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Erottele kuukausibudjetin menot tai suunnittele lomamatkan kulut.
          Donitsi näyttää minne rahat menevät ja valinnainen säästötavoite
          näyttää milloin saavutat tavoitteen.
        </p>
      </header>

      <BudgetVisualizer />
    </div>
  );
}
