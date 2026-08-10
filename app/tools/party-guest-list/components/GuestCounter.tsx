import type { GuestCounts } from "@/lib/party-guest-list";
import { TICK_COLUMNS } from "../copy";

type Props = { counts: GuestCounts };

/** Running head count, pinned under the site header so it survives scrolling
 *  a long list. The site header is `h-14`, hence `top-14`. */
export default function GuestCounter({ counts }: Props) {
  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border border-zinc-200 bg-white/90 px-5 py-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{counts.total}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {counts.total === 1 ? "guest" : "guests"}
        </span>
      </p>
      <p className="ml-auto flex items-baseline gap-3 text-sm">
        <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
          {counts.confirmed}{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            {TICK_COLUMNS.confirmed.label}
          </span>
        </span>
        <span className="font-medium tabular-nums text-sky-600 dark:text-sky-400">
          {counts.arrived}{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">here</span>
        </span>
      </p>
    </div>
  );
}
