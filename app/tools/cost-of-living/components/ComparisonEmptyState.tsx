type Props =
  | { variant: "same-year" }
  | { variant: "missing-baseline"; baselineYear: number };

/** Placeholder shown before there's enough input for a real comparison. */
export default function ComparisonEmptyState(props: Props) {
  if (props.variant === "same-year") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Pick two different years to compare your salary across time.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
      Enter your {props.baselineYear} salary to compare buying power.
    </div>
  );
}
