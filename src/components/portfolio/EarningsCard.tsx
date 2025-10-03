"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import type { PortfolioSummary } from "@/types/vault";
import { formatNumber } from "@/lib/utils";
import { Info, TrendingUp } from "lucide-react";

interface EarningsCardProps {
  summary: PortfolioSummary;
}

/**
 * Earnings breakdown card
 * Shows Earnings to Date, Unrealized, and Realized
 */
export function EarningsCard({ summary }: EarningsCardProps) {
  const totalEarnings = summary.unrealizedSol + summary.realizedSol;

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Earnings</h3>
        <Tooltip
          content={
            <div className="text-xs space-y-1">
              <p><strong>Unrealized:</strong> Current value - Cost basis</p>
              <p><strong>Realized:</strong> Sum of claimed withdrawals - Cost basis</p>
            </div>
          }
        >
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </Tooltip>
      </div>

      <div className="space-y-4">
        {/* Earnings to Date */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Earnings to Date</div>
          <div className="text-3xl font-bold text-foreground">
            {formatNumber(totalEarnings, 2)} SOL
          </div>
        </div>

        {/* Breakdown */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Unrealized</div>
            <div className="text-sm font-semibold text-green-500">
              {formatNumber(summary.unrealizedSol, 2)} SOL
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Realized</div>
            <div className="text-sm font-semibold">
              {formatNumber(summary.realizedSol, 2)} SOL
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Unrealized = Current Value - Cost Basis</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-foreground/30" />
              <span>Realized = Claimed Withdrawals</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
