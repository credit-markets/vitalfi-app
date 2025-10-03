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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Healthy Yield
          </h1>
          <p className="text-muted-foreground mt-2">
            Medical Receivables Vault • 90-day Principal Lock
          </p>
        </div>
        <Badge variant={vaultState.paused ? "warning" : "success"} className="text-sm px-4 py-2">
          {vaultState.paused ? "Paused" : "Active"}
        </Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="p-6 bg-gradient-card border-border/50 hover:scale-105 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
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
