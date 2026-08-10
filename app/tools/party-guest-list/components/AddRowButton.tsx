import { memo } from "react";

type Props = {
  label: string;
  onClick: () => void;
  /** Quieter styling for the secondary "add a section" action. */
  isSubtle?: boolean;
};

/** Dashed full-width row that appends a guest or a section. */
function AddRowButton({ label, onClick, isSubtle }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-dashed py-2.5 font-medium transition-colors ${
        isSubtle
          ? "border-zinc-200 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
          : "border-zinc-300 text-sm text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
      }`}
    >
      {label}
    </button>
  );
}

export default memo(AddRowButton);
