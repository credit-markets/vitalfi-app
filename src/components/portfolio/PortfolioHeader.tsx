"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompactCurrency } from "@/lib/formatters";
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
import type { PortfolioSummary, PortfolioPosition } from "@/hooks/usePortfolio";
import { getNextMaturity, getStageBreakdown } from "@/lib/portfolio/selectors";
import { pluralize } from "@/lib/utils";

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

  const kpis = useMemo(() => [
    {
      label: "Invested Amount",
      value: formatCompactCurrency(summary.totalDepositedSol),
      icon: DollarSign,
      tooltip: "Total amount deposited across all positions",
    },
    {
      label: "Expected Yield",
      value: formatCompactCurrency(summary.totalExpectedYieldSol),
      icon: TrendingUp,
      tooltip: "Expected yield across active positions at maturity",
    },
    {
      label: "Expected Value at Maturity",
      value: formatCompactCurrency(summary.totalAtMaturitySol),
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
  ], [summary, nextMaturity]);

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
          {stageBreakdown.fundedPct > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {stageBreakdown.fundedPct}% Funded
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
