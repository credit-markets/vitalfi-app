"use client";

import { formatCompactCurrency, formatPricePerShare, formatDelta, formatSOL } from "@/lib/formatters";
import type { VaultStats, CollateralSnapshot } from "@/types/vault";

interface HeaderFactsProps {
  stats: VaultStats;
  snapshot: CollateralSnapshot;
  lastUpdated: string;
}

export function HeaderFacts({ stats, snapshot, lastUpdated }: HeaderFactsProps) {
  const updatedAt = new Date(lastUpdated);
  const ageSeconds = Math.floor((Date.now() - updatedAt.getTime()) / 1000);
  const isStale = ageSeconds > 30;

  const formatAge = () => {
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    const mins = Math.floor(ageSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <section className="border border-border rounded-2xl p-6 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-8">
          <Kpi label="TVL" value={formatCompactCurrency(stats.tvl)} />
          <Kpi label="Price per Share" value={formatPricePerShare(stats.pricePerShare)} />
          <Kpi label="APY" value={formatDelta(stats.apy, 1, false)} />
          <Kpi label="Cap Remaining" value={formatCompactCurrency(stats.capRemaining)} />
          <Kpi label="Liquidity Buffer" value={formatSOL(snapshot.liquidityBufferSol, 0)} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Last updated {formatAge()}</span>
          {isStale && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
              Stale
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}
