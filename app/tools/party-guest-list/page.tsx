import type { Metadata } from "next";
import Link from "next/link";
import PartyGuestList from "./PartyGuestList";

export const metadata: Metadata = {
  title: "Party Guest List",
  description:
    "Build a guest list with RSVP and door check-in ticks — drag a name sideways to make them someone's plus-one.",
};

export default function PartyGuestListPage() {
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
        <span className="text-zinc-700 dark:text-zinc-300">Party Guest List</span>
      </nav>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          🎉 Party Guest List
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tick guests off as they RSVP and as they arrive, with a running head
          count — and drag a name sideways to file them as someone&rsquo;s plus-one.
        </p>
      </header>
      <PartyGuestList />
    </div>
  );
}
