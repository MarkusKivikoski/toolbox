import { yearsDescending } from "@/lib/cost-of-living";

const YEARS = yearsDescending();

type Props = {
  label: string;
  year: number;
  salary: string;
  onYear: (year: number) => void;
  onSalary: (value: string) => void;
  yearId: string;
  salaryId: string;
};

/** A labelled year-picker and euro amount for one salary in the comparison. */
export default function SalaryRow({
  label,
  year,
  salary,
  onYear,
  onSalary,
  yearId,
  salaryId,
}: Props) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="grid grid-cols-[6.5rem_1fr] gap-2 sm:grid-cols-[8rem_1fr] sm:gap-3">
        <select
          id={yearId}
          value={year}
          onChange={(event) => onYear(Number(event.target.value))}
          aria-label={`${label} year`}
          className="w-full rounded-xl border border-zinc-300 bg-white px-2 py-2.5 text-base font-medium tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
        >
          {YEARS.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </select>
        <div className="flex items-center rounded-xl border border-zinc-300 bg-zinc-50 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="text-lg font-semibold text-zinc-400">€</span>
          <input
            id={salaryId}
            type="text"
            inputMode="decimal"
            value={salary}
            onChange={(event) => onSalary(event.target.value)}
            placeholder="0"
            aria-label={`${label} amount`}
            className="w-full min-w-0 bg-transparent py-2.5 pl-2 text-lg font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
          <span className="pl-1 text-xs text-zinc-400">/mo</span>
        </div>
      </div>
    </div>
  );
}
