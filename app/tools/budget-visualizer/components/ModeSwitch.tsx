import type { Mode } from "@/lib/budget";
import { COPY } from "../copy";

const MODES: Mode[] = ["salary", "trip"];

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

/** Segmented control switching between the salary-budget and trip datasets. */
export default function ModeSwitch({ mode, onModeChange }: Props) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
      {MODES.map((tabMode) => (
        <button
          key={tabMode}
          type="button"
          onClick={() => onModeChange(tabMode)}
          aria-pressed={mode === tabMode}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === tabMode
              ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {COPY[tabMode].tab}
        </button>
      ))}
    </div>
  );
}
