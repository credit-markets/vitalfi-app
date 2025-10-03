"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSeries } from "@/hooks/useSeries";
import { formatCompactCurrency, formatPricePerShare, formatDelta } from "@/lib/formatters";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";

type ChartMetric = "pps" | "tvl" | "inflows";
type ChartPeriod = "7d" | "30d";

/**
 * Option B: Slim area chart with metric/timeframe switchers
 * Only shown if SHOW_SLIM_CHART feature flag is enabled
 */
export function SlimChart() {
  const [metric, setMetric] = useState<ChartMetric>("pps");
  const [period, setPeriod] = useState<ChartPeriod>("30d");
  const { pps30d, tvl30d, inflows30d } = useSeries();

  // Filter data based on period
  const getData = () => {
    let data = metric === "pps" ? pps30d : metric === "tvl" ? tvl30d : inflows30d;

    if (period === "7d") {
      data = data.slice(-7);
    }

    return data.map((d, i) => ({
      index: i,
      value: d.value,
      timestamp: new Date(d.timestamp).toLocaleDateString(),
    }));
  };

  const chartData = getData();
  const currentValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[0]?.value || 0;
  const change = ((currentValue - previousValue) / previousValue) * 100;

  const formatValue = (value: number) => {
    if (metric === "pps") return formatPricePerShare(value);
    if (metric === "tvl") return formatCompactCurrency(value);
    return formatCompactCurrency(value);
  };

  const getLabel = () => {
    if (metric === "pps") return "Price per Share";
    if (metric === "tvl") return "Total Value Locked";
    return "Inflows";
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground">{getLabel()}</div>
          <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
          <div className={`text-sm font-semibold ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatDelta(change)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={metric} onValueChange={(v) => setMetric(v as ChartMetric)}>
            <TabsList className="h-8">
              <TabsTrigger value="pps" className="text-xs px-3">PPS</TabsTrigger>
              <TabsTrigger value="tvl" className="text-xs px-3">TVL</TabsTrigger>
              <TabsTrigger value="inflows" className="text-xs px-3">Inflows</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-3">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="index"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatValue(value), getLabel()]}
              labelFormatter={(label: number) => chartData[label]?.timestamp}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
