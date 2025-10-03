"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { PpsPoint } from "@/types/vault";

interface SparklineProps {
  data: PpsPoint[];
  className?: string;
}

/**
 * Tiny PPS sparkline chart (no grid, no axes)
 * Used in portfolio ValueCard
 */
export function Sparkline({ data, className }: SparklineProps) {
  const chartData = data.map((d) => ({
    value: d.pps,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
