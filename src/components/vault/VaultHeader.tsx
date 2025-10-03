"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { VaultState } from "@/types/vault";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { Activity, TrendingUp, DollarSign, Calendar, Users } from "lucide-react";

interface VaultHeaderProps {
  vaultState: VaultState;
}

export function VaultHeader({ vaultState }: VaultHeaderProps) {
  // Calculate status badges
  const capUtilization = (vaultState.tvl / vaultState.cap) * 100;
  const liquidityRatio = (vaultState.liquidityBuffer / vaultState.tvl) * 100;

  const getVaultStatus = () => {
    if (vaultState.paused) return { label: "Paused", variant: "destructive" as const };
    if (capUtilization > 90) return { label: "Reaching Cap", variant: "secondary" as const };
    if (liquidityRatio < 5) return { label: "Low Liquidity", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  const status = getVaultStatus();

  const kpis = [
    {
      label: "TVL",
      value: formatCurrency(vaultState.tvl, 0),
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Current APY",
      value: formatPercentage(vaultState.currentAPY),
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      label: "Principal Rate",
      value: `${formatNumber(vaultState.principalRedemptionValue)}x`,
      icon: Activity,
      color: "text-secondary",
    },
    {
      label: "Yield APR",
      value: formatPercentage(vaultState.yieldAPR),
      icon: TrendingUp,
      color: "text-impact",
    },
    {
      label: "Cap Remaining",
      value: formatCurrency(vaultState.capRemaining, 0),
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      label: "Last Repayment",
      value: `${Math.floor((Date.now() - vaultState.lastRepaymentAt.getTime()) / (1000 * 60 * 60 * 24))}d ago`,
      icon: Calendar,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title and Status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Healthy Yield
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Medical Receivables Vault • 90-day Principal Lock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="text-sm px-4 py-2">
            {status.label}
          </Badge>
          {vaultState.nextRepaymentETA && (
            <Badge variant="outline" className="text-sm px-4 py-2">
              Next Repayment: {vaultState.nextRepaymentETA.toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="p-4 sm:p-6 bg-gradient-card border-border/50 hover:scale-105 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">{kpi.label}</span>
                <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${kpi.color}`} />
              </div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Optional 3D Animation Placeholder */}
      <div className="hidden lg:block">
        <Card className="p-8 bg-gradient-card border-primary/20 text-center">
          <div className="text-muted-foreground text-sm">
            [3D Animation Placeholder - Future: Add Spline scene]
          </div>
        </Card>
      </div>
    </div>
  );
}
