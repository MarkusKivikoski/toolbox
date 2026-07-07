type StatTileProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "zinc" | "amber";
};

/** A small labelled figure card used across the results panels. */
export default function StatTile({ label, value, sub, accent }: StatTileProps) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}
