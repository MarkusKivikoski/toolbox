import type { InvestingResult } from "@/lib/investing";
import { formatEur } from "@/lib/format";
import StatTile from "./StatTile";

type AccumulationStatsProps = {
  result: InvestingResult;
};

/** The three saving-phase tiles: starting balance, contributions, growth. */
export default function AccumulationStats({ result }: AccumulationStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatTile
        label="Starting balance"
        value={formatEur(result.startingBalance)}
      />
      <StatTile
        label="You invested"
        value={formatEur(result.totalContributions)}
        sub={`age ${result.currentAge} → ${result.retirementAge}`}
      />
      <StatTile
        label="Investment growth"
        value={formatEur(result.accumulationGrowth)}
        accent="emerald"
        sub="compounded returns"
      />
    </div>
  );
}
