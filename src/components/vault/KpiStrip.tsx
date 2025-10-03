"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useVaultStats } from "@/hooks/useVaultStats";
import { formatCompactCurrency, formatPricePerShare } from "@/lib/formatters";
import { formatPercentage } from "@/lib/utils";
import { DollarSign, TrendingUp, Coins, Users, Clock, ExternalLink } from "lucide-react";
import { SOLSCAN_BASE_URL, CLUSTER } from "@/lib/constants";

/**
 * Compact KPI strip showing key vault metrics
 * Replaces the old hero header with clean, scannable stats
 */
export function KpiStrip() {
  const stats = useVaultStats();

  const kpis = [
    {
      label: "TVL",
      value: formatCompactCurrency(stats.tvl),
      tooltip: `Total Value Locked: ${formatCompactCurrency(stats.tvl)}`,
      icon: DollarSign,
      link: `${SOLSCAN_BASE_URL}/account/${stats.addresses.vaultTokenAccount}${CLUSTER !== "mainnet-beta" ? `?cluster=${CLUSTER}` : ""}`,
    },
    {
      label: "Current APY",
      value: formatPercentage(stats.apy),
      tooltip: `Annual Percentage Yield: ${formatPercentage(stats.apy)}`,
      icon: TrendingUp,
    },
    {
      label: "Price per Share",
      value: formatPricePerShare(stats.pricePerShare),
      tooltip: `Current redemption value per share: ${formatPricePerShare(stats.pricePerShare)} SOL`,
      icon: Coins,
    },
    {
      label: "Cap Remaining",
      value: formatCompactCurrency(stats.capRemaining),
      tooltip: `Available vault capacity: ${formatCompactCurrency(stats.capRemaining)} of ${formatCompactCurrency(stats.cap)} total`,
      icon: Users,
    },
    {
      label: "Queue / Avg Claim",
      value: `${stats.queueDepth} / ${stats.avgClaimTimeDays}d`,
      tooltip: `${stats.queueDepth} pending withdrawals, average claim time ${stats.avgClaimTimeDays} days`,
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Tooltip key={kpi.label} content={<p className="text-sm">{kpi.tooltip}</p>}>
            <Card className="p-3 sm:p-4 bg-card border border-border hover:border-primary/30 transition-colors cursor-default">
              <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{kpi.label}</span>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/60" />
                  {kpi.link && (
                    <a
                      href={kpi.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary active:text-primary transition-colors touch-manipulation p-1"
                      aria-label={`View ${kpi.label} on Solscan`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{kpi.value}</div>
            </Card>
          </Tooltip>
        );
      })}
    </div>
  );
}
