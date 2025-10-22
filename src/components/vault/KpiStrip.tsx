"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

export interface KpiStripProps {
  vaultId: string;
}

/**
 * Compact KPI strip for funding vault
 * Shows 4 cards only: TVL, Expected APY, Cap Remaining, Days to Maturity
 */
export function KpiStrip({ vaultId }: KpiStripProps) {
  const { info, computed } = useVaultAPI(vaultId);

  // Early return if data not loaded (error state handled by parent)
  if (!info || !computed) {
    return null;
  }

  const kpis = [
    {
      label: "TVL",
      value: formatCompactCurrency(info.tvlSol),
      tooltip: `Total Value Locked: ${formatCompactCurrency(info.tvlSol)} SOL`,
      icon: DollarSign,
    },
    {
      label: "Expected APY",
      value: `${info.expectedApyPct.toFixed(1)}% p.y.`,
      tooltip: `Expected Annual Percentage Yield: ${info.expectedApyPct}%`,
      icon: TrendingUp,
    },
    {
      label: "Cap Remaining",
      value: formatCompactCurrency(computed.capRemainingSol),
      tooltip: `Available capacity: ${formatCompactCurrency(computed.capRemainingSol)} of ${formatCompactCurrency(info.capSol)} total`,
      icon: Users,
    },
    {
      label: "Days to Maturity",
      value: computed.daysToMaturity,
      tooltip: `Days until principal and yield are distributed`,
      icon: Calendar,
    },
  ];

  return (
    <div className="mb-4 sm:mb-6">
      {/* KPI Grid - 4 cards only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Tooltip key={kpi.label} content={<p className="text-sm">{kpi.tooltip}</p>}>
              <Card className="p-3 sm:p-4 bg-card border border-border hover:border-primary/30 transition-colors cursor-default">
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground/80 leading-tight">{kpi.label}</span>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/50 flex-shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{kpi.value}</div>
              </Card>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
