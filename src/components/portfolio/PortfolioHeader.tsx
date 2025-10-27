"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
import type { PortfolioSummary, PortfolioPosition } from "@/hooks/vault/use-portfolio-api";
import { getNextMaturity, getStageBreakdown } from "@/lib/portfolio/selectors";
import { pluralize } from "@/lib/utils";
import { getTokenSymbol } from "@/lib/sdk/config";

interface PortfolioHeaderProps {
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
}

/**
 * Portfolio header with 4 KPIs + stage breakdown visualization
 * Matches the institutional dark UI from the vault page
 */
export function PortfolioHeader({ summary, positions }: PortfolioHeaderProps) {
  const nextMaturity = useMemo(() => getNextMaturity(positions), [positions]);
  const stageBreakdown = useMemo(() => getStageBreakdown(positions), [positions]);

  // Get token symbol from first position (all positions should use same token)
  const tokenSymbol = useMemo(() => {
    if (positions.length === 0) return '';
    const firstPosition = positions[0];
    if (!firstPosition.assetMint) return '';
    return getTokenSymbol(firstPosition.assetMint);
  }, [positions]);

  const kpis = useMemo(() => [
    {
      label: "Invested Amount",
      value: `${formatCompactNumber(summary.totalDepositedSol)} ${tokenSymbol}`,
      icon: DollarSign,
      tooltip: "Total amount deposited across all positions",
    },
    {
      label: "Expected Yield",
      value: `${formatCompactNumber(summary.totalExpectedYieldSol)} ${tokenSymbol}`,
      icon: TrendingUp,
      tooltip: "Expected yield across active positions at maturity",
    },
    {
      label: "Expected Value at Maturity",
      value: `${formatCompactNumber(summary.totalAtMaturitySol)} ${tokenSymbol}`,
      icon: Target,
      tooltip: "Total principal + expected yield",
    },
    {
      label: "Next Maturity",
      value: nextMaturity
        ? `${pluralize(nextMaturity.daysAway, 'day')}`
        : "—",
      icon: Calendar,
      tooltip: nextMaturity
        ? `Nearest upcoming maturity: ${nextMaturity.vaultName}`
        : "No active positions with upcoming maturity",
    },
  ], [summary, nextMaturity, tokenSymbol]);

  return (
    <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
      {/* 4 KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Tooltip key={kpi.label} content={<p className="text-sm">{kpi.tooltip}</p>}>
              <Card className="p-3 sm:p-4 bg-card border border-border hover:border-primary/30 transition-colors cursor-default">
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground/80 leading-tight">
                    {kpi.label}
                  </span>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/50 flex-shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {kpi.value}
                </div>
              </Card>
            </Tooltip>
          );
        })}
      </div>

      {/* Stage Breakdown */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Portfolio:</span>
          {stageBreakdown.fundingPct > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {stageBreakdown.fundingPct}% Funding
            </span>
          )}
          {stageBreakdown.activePct > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {stageBreakdown.activePct}% Active
            </span>
          )}
          {stageBreakdown.maturedPct > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {stageBreakdown.maturedPct}% Matured
            </span>
          )}
        </div>
      )}
    </div>
  );
}
