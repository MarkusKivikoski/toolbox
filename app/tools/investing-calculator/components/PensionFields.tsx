import type { RetirementSettings } from "@/lib/investing";
import NumberField from "./NumberField";

type PensionFieldsProps = {
  retirement: RetirementSettings;
  onPatch: (patch: Partial<RetirementSettings>) => void;
};

/** The optional kansaneläke (state pension) block inside the retirement form. */
export default function PensionFields({ retirement, onPatch }: PensionFieldsProps) {
  return (
    <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Kansaneläke (state pension)
      </div>
      <p className="mb-3 mt-0.5 text-xs text-zinc-400">
        Optional — added on top of your withdrawals as income. Rises with
        inflation.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Kansaneläke / month"
          value={retirement.kansanelake}
          onChange={(kansanelake) => onPatch({ kansanelake })}
          prefix="€"
          hint="0 = none"
        />
        {retirement.kansanelake > 0 && (
          <>
            <NumberField
              label="Pension tax"
              value={retirement.kansanelakeTaxPct}
              onChange={(kansanelakeTaxPct) => onPatch({ kansanelakeTaxPct })}
              suffix="%"
            />
            <NumberField
              label="Pension starts at age"
              value={retirement.kansanelakeStartAge}
              onChange={(startAge) =>
                onPatch({ kansanelakeStartAge: Math.round(startAge) })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
