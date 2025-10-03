"use client";

import { formatCompactCurrency } from "@/lib/formatters";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReconciliationData } from "@/types/vault";

interface ReconciliationCardProps {
  reconciliation: ReconciliationData;
}

export function ReconciliationCard({ reconciliation }: ReconciliationCardProps) {
  const { assetsOnChain, supply, pps, tvl, delta } = reconciliation;

  const deltaPct = Math.abs(delta / tvl) * 100;
  const isInSync = deltaPct <= 0.1;

  const status = isInSync
    ? { label: "In sync ✓", color: "text-green-500 bg-green-500/10 border-green-500/20" }
    : { label: "Pending / buffer / fee float", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };

  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <h2 className="text-lg font-semibold">Reconciliation</h2>

      <div className="space-y-4">
        <Stat label="Assets on chain" value={formatCompactCurrency(assetsOnChain)} />
        <Stat label="Supply × PPS" value={formatCompactCurrency(supply * pps)} />
        <Stat label="Displayed TVL" value={formatCompactCurrency(tvl)} />
      </div>

      <div className="pt-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Delta</span>
          <span className="text-sm font-medium font-mono">
            {delta >= 0 ? "+" : ""}
            {formatCompactCurrency(delta)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Tooltip
            content={
              <p className="text-xs">
                {isInSync
                  ? "On-chain assets match displayed TVL within 0.1% tolerance."
                  : "Small variance due to pending transactions, liquidity buffer adjustments, or protocol fees."}
              </p>
            }
          >
            <span className={`px-2 py-1 rounded text-xs font-medium border ${status.color} cursor-help`}>
              {status.label}
            </span>
          </Tooltip>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold font-mono">{value}</span>
    </div>
  );
}
