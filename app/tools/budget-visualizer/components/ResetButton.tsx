import type { Mode } from "@/lib/budget";
import { TONE } from "../copy";

type Props = {
  mode: Mode;
  confirmReset: boolean;
  onReset: () => void;
};

/** Two-tap reset for the active tab's data — arms on the first tap, clears on the second. */
export default function ResetButton({ mode, confirmReset, onReset }: Props) {
  const noun = mode === "trip" ? "trip" : "budget";
  return (
    <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <button
        type="button"
        onClick={onReset}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
          confirmReset
            ? TONE.amber
            : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path
            fillRule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
            clipRule="evenodd"
          />
        </svg>
        {confirmReset ? `Tap again to clear this ${noun}` : `Reset ${noun}`}
      </button>
    </div>
  );
}
