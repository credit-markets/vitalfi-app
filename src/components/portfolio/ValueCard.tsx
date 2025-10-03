"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/common/Stat";
import { Sparkline } from "@/components/common/Sparkline";
import type { PortfolioSummary, PpsPoint } from "@/types/vault";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { formatDelta, formatRelativeTime } from "@/lib/formatters";

interface ValueCardProps {
  summary: PortfolioSummary;
  ppsSeries: PpsPoint[];
}

/**
 * Holdings & Value card
 * Shows current value, shares breakdown, next unlock, and PPS sparkline
 */
export function ValueCard({ summary, ppsSeries }: ValueCardProps) {
  // Calculate delta since deposit (unrealized gain %)
  const deltaPercent = summary.costBasisSol > 0
    ? ((summary.currentValueSol - summary.costBasisSol) / summary.costBasisSol) * 100
    : 0;

  // Calculate PPS change for sparkline
  const ppsStart = ppsSeries[0]?.pps || 1;
  const ppsEnd = ppsSeries[ppsSeries.length - 1]?.pps || 1;
  const ppsChange = ((ppsEnd - ppsStart) / ppsStart) * 100;

  return (
    <Card className="p-4 sm:p-6 bg-card border border-border">
      <div className="space-y-4 sm:space-y-6">
        {/* Current Value */}
        <div>
          <Stat
            label="Current Value"
            value={`${formatNumber(summary.currentValueSol, 2)} SOL`}
            delta={deltaPercent}
            deltaLabel="since deposit"
          />
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            ≈ {formatCurrency(summary.currentValueUsd, 0)}
          </div>
        </div>

        {/* Shares breakdown */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Shares: <span className="font-semibold text-foreground">{formatNumber(summary.sharesTotal, 2)}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500 text-[10px] sm:text-xs">
              Unlocked: {formatNumber(summary.sharesUnlocked, 2)}
            </Badge>
            <Badge variant="outline" className="bg-muted/30 text-[10px] sm:text-xs">
              Locked: {formatNumber(summary.sharesLocked, 2)}
            </Badge>
          </div>
        </div>

        {/* Next Unlock */}
        {summary.nextUnlock && (
          <div className="pt-3 sm:pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-[11px] sm:text-xs text-muted-foreground">Next Unlock</div>
              {summary.allUnlocks && summary.allUnlocks.length > 1 && (
                <div className="text-[11px] sm:text-xs text-muted-foreground">
                  +{summary.allUnlocks.length - 1} more
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm sm:text-base font-semibold">
                  {formatNumber(summary.nextUnlock.shares, 2)} shares
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">
                  {formatRelativeTime(summary.nextUnlock.date)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PPS Sparkline */}
        <div className="pt-3 sm:pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] sm:text-xs text-muted-foreground">PPS (30D)</div>
            <div className="text-xs sm:text-sm font-semibold text-primary">
              {formatDelta(ppsChange)}
            </div>
          </div>
          <Sparkline data={ppsSeries} className="h-10 sm:h-12" />
        </div>
      </div>
    </Card>
  );
}
