export type SegmentedToggleOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedToggleProps<Value extends string> = {
  label: string;
  options: readonly SegmentedToggleOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

/** A labelled pill group where exactly one option is active. */
export default function SegmentedToggle<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedToggleProps<Value>) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div
        className="grid w-full gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800/60"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${
              value === option.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
