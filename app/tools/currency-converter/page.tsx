import type { Metadata } from "next";
import Link from "next/link";
import CurrencyConverter from "./CurrencyConverter";

export const metadata: Metadata = {
  title: "Currency Converter",
  description:
    "Convert one amount into several currencies at once, using free daily reference rates that keep working offline.",
};

export default function CurrencyConverterPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
          Toolbox
        </Link>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">Currency Converter</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          💱 Currency Converter
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Enter an amount and see it in all your favorite currencies at once.
          Daily reference rates, saved on your device so the last rates keep
          working offline.
        </p>
      </header>

      <CurrencyConverter />
    </div>
  );
}
