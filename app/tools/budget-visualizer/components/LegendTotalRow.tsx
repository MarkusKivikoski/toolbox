import { formatEur, formatPercent } from "@/lib/format";
import { PERCENT_LOCALE } from "../constants";

type Props = {
  label: string;
  amount: number;
  /** Share to show beside the amount, 0–1; omit to leave the column blank. */
  fraction?: number;
  /** Replaces the amount with a message (e.g. "all paid"), in the success tone. */
  successMessage?: string;
  /** The first summary row draws the divider above the group. */
  isFirst?: boolean;
};

/** A summary row under the legend list: aligned label, percent and amount. */
export default function LegendTotalRow({
  label,
  amount,
  fraction,
  successMessage,
  isFirst = false,
}: Props) {
  return (
    <li
      className={`flex items-center gap-3 px-2 ${
        isFirst ? "mt-1 border-t border-zinc-100 pt-2 dark:border-zinc-800" : "pt-1"
      }`}
    >
      <span className="h-4 w-4 shrink-0" aria-hidden />
      <span className="h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 text-sm font-medium text-zinc-500">{label}</span>
      <span className="shrink-0 text-xs tabular-nums text-zinc-400">
        {fraction !== undefined ? formatPercent(fraction, { locale: PERCENT_LOCALE }) : ""}
      </span>
      <span
        className={`min-w-20 shrink-0 text-right text-sm font-semibold tabular-nums ${
          successMessage
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {successMessage ?? formatEur(amount)}
      </span>
    </li>
  );
}
