import NumberField from "./NumberField";

type AdvancedSectionProps = {
  inflationPct: number;
  onChange: (inflationPct: number) => void;
};

/** Collapsed extras — currently just the inflation assumption. */
export default function AdvancedSection({
  inflationPct,
  onChange,
}: AdvancedSectionProps) {
  return (
    <details className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Advanced
      </summary>
      <div className="mt-3">
        <NumberField
          label="Inflation"
          value={inflationPct}
          onChange={onChange}
          suffix="%"
          hint="If set, also shows values in today's money."
        />
      </div>
    </details>
  );
}
