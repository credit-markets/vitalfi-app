"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { formatPricePerShare, formatDelta } from "@/lib/formatters";
import type { DerivedMetrics } from "@/types/vault";

interface DerivationsChartsProps {
  derived: DerivedMetrics;
  onViewEvents: () => void;
}

type ChartView = "pps" | "apr7d" | "apr30d";

export function DerivationsCharts({ derived, onViewEvents }: DerivationsChartsProps) {
  const [view, setView] = useState<ChartView>("pps");

  const chartData =
    view === "pps"
      ? derived.ppsSeries.map(pt => ({ t: new Date(pt.t).getTime(), value: pt.pps }))
      : view === "apr7d"
      ? derived.apr7d.map(pt => ({ t: new Date(pt.t).getTime(), value: pt.apr * 100 }))
      : derived.apr30d.map(pt => ({ t: new Date(pt.t).getTime(), value: pt.apr * 100 }));

  const latestValue = chartData[chartData.length - 1]?.value ?? 0;
  const firstValue = chartData[0]?.value ?? 0;
  const delta = latestValue - firstValue;
  const deltaPct = firstValue > 0 ? (delta / firstValue) * 100 : 0;

  const formatYAxis = (value: number) => {
    if (view === "pps") return formatPricePerShare(value, 3);
    return `${value.toFixed(1)}%`;
  };

  const formatTooltip = (value: number) => {
    if (view === "pps") return formatPricePerShare(value, 4);
    return formatDelta(value, 2, false);
  };

  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Derivations</h2>
        <div className="flex items-center gap-2">
          <Tab active={view === "pps"} onClick={() => setView("pps")}>Price per Share</Tab>
          <Tab active={view === "apr7d"} onClick={() => setView("apr7d")}>APR (7d)</Tab>
          <Tab active={view === "apr30d"} onClick={() => setView("apr30d")}>APR (30d)</Tab>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">
            {view === "pps"
              ? formatPricePerShare(latestValue, 4)
              : formatDelta(latestValue, 2, false)}
          </span>
          <span
            className={`text-sm font-medium ${
              delta >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {formatDelta(Math.abs(deltaPct), 2, false)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(v: number) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              width={60}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatTooltip(value), view === "pps" ? "PPS" : "APR"]}
              labelFormatter={(v: number) => new Date(v).toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Derived from on-chain events (deposits, claims, repayments).
        </p>
        <button
          onClick={onViewEvents}
          className="text-xs text-primary hover:underline font-medium"
        >
          View related events →
        </button>
      </div>
    </section>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
