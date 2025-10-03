"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { TrendingUp, Shield, Lock, Clock, DollarSign } from "lucide-react";
import type { VaultState } from "@/types/vault";

interface VaultAnalyticsProps {
  vaultState: VaultState;
}

type ChartMetric = "tvl" | "redemption" | "yield";
type ChartPeriod = "7d" | "30d";

export function VaultAnalytics({ vaultState }: VaultAnalyticsProps) {
  const [metric, setMetric] = useState<ChartMetric>("tvl");
  const [period, setPeriod] = useState<ChartPeriod>("7d");

  // Mock chart data - in production would come from API
  const chartData = {
    tvl: period === "7d"
      ? [2200000, 2250000, 2300000, 2280000, 2350000, 2380000, 2400000]
      : [1800000, 1900000, 2000000, 2100000, 2150000, 2200000, 2250000, 2300000, 2350000, 2400000],
    redemption: period === "7d"
      ? [1.00, 1.005, 1.01, 1.012, 1.015, 1.018, 1.02]
      : [1.00, 1.002, 1.004, 1.006, 1.008, 1.01, 1.012, 1.014, 1.016, 1.018, 1.02],
    yield: period === "7d"
      ? [8.2, 8.3, 8.4, 8.5, 8.5, 8.6, 8.5]
      : [7.8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.5, 8.6, 8.5],
  };

  const currentData = chartData[metric];
  const maxValue = Math.max(...currentData);
  const minValue = Math.min(...currentData);

  const riskParams = [
    {
      label: "Principal Lockup",
      value: "90 days",
      icon: Lock,
      color: "text-primary",
    },
    {
      label: "Withdrawal Delay",
      value: "2 days",
      icon: Clock,
      color: "text-accent",
    },
    {
      label: "Liquidity Buffer",
      value: formatCurrency(vaultState.liquidityBuffer, 0),
      icon: DollarSign,
      color: "text-secondary",
    },
    {
      label: "Vault Cap",
      value: formatCurrency(vaultState.cap, 0),
      icon: Shield,
      color: "text-impact",
    },
  ];

  const getMetricLabel = (m: ChartMetric) => {
    switch (m) {
      case "tvl": return "Total Value Locked";
      case "redemption": return "Share Redemption Value";
      case "yield": return "Yield APY";
    }
  };

  const formatMetricValue = (value: number, m: ChartMetric) => {
    switch (m) {
      case "tvl": return formatCurrency(value, 0);
      case "redemption": return `${formatNumber(value)}x`;
      case "yield": return formatPercentage(value);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Chart Section - 2 columns */}
      <Card className="lg:col-span-2 p-8 bg-gradient-card border-border/50">
        <div className="space-y-6">
          {/* Chart Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Analytics</h3>
            <div className="flex items-center gap-4">
              {/* Metric Toggle */}
              <Tabs value={metric} onValueChange={(v) => setMetric(v as ChartMetric)}>
                <TabsList>
                  <TabsTrigger value="tvl">TVL</TabsTrigger>
                  <TabsTrigger value="redemption">Shares</TabsTrigger>
                  <TabsTrigger value="yield">Yield</TabsTrigger>
                </TabsList>
              </Tabs>
              {/* Period Toggle */}
              <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
                <TabsList>
                  <TabsTrigger value="7d">7D</TabsTrigger>
                  <TabsTrigger value="30d">30D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Current Value */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">{getMetricLabel(metric)}</div>
            <div className="text-4xl font-bold text-accent">
              {formatMetricValue(currentData[currentData.length - 1], metric)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent">
                +{formatPercentage(((currentData[currentData.length - 1] - currentData[0]) / currentData[0]) * 100)}
              </span>
              <span className="text-sm text-muted-foreground">vs {period} ago</span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="h-48 relative">
            <div className="absolute inset-0 flex items-end gap-1">
              {currentData.map((value, i) => {
                const height = ((value - minValue) / (maxValue - minValue)) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-accent/80 to-primary/60 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                      {formatMetricValue(value, metric)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution */}
          <div className="pt-6 border-t border-border/50">
            <h4 className="font-semibold mb-4">Vault Distribution</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Deployed Capital</span>
                  <span className="font-medium">{formatPercentage((vaultState.tvl / vaultState.cap) * 100)}</span>
                </div>
                <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${(vaultState.tvl / vaultState.cap) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Liquidity Buffer: </span>
                  <span className="font-medium">{formatPercentage((vaultState.liquidityBuffer / vaultState.tvl) * 100)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cap Remaining: </span>
                  <span className="font-medium">{formatCurrency(vaultState.capRemaining, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Parameters - 1 column */}
      <Card className="p-8 bg-gradient-card border-border/50">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Risk Parameters</h3>
          </div>

          <div className="space-y-4">
            {riskParams.map((param) => {
              const Icon = param.icon;
              return (
                <div key={param.label} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${param.color}`} />
                    <span className="text-sm text-muted-foreground">{param.label}</span>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {param.value}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Queue Stats */}
          <div className="pt-6 border-t border-border/50 space-y-3">
            <h4 className="font-semibold text-sm">Withdrawal Queue</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Queue Depth</span>
                <span className="font-medium">{vaultState.queueDepth} requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Claim Time</span>
                <span className="font-medium">2 days</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
