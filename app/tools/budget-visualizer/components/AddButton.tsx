import { memo } from "react";

type Props = {
  label: string;
  onClick: () => void;
};

/** Dashed full-width "add another row" button. */
function AddButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M10 4.75a.75.75 0 0 1 .75.75v3.75h3.75a.75.75 0 0 1 0 1.5h-3.75v3.75a.75.75 0 0 1-1.5 0v-3.75H5.5a.75.75 0 0 1 0-1.5h3.75V5.5a.75.75 0 0 1 .75-.75Z" />
      </svg>
      {label}
    </button>
  );
}

export default memo(AddButton);
