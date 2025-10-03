"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Point, ApyPoint } from "@/lib/derive";

interface DerivationChartsProps {
  pricePerShareSeries: Point[];
  apySeries: ApyPoint[];
}

export function DerivationCharts({ pricePerShareSeries, apySeries }: DerivationChartsProps) {
  const [activeTab, setActiveTab] = useState<"pps" | "apy">("pps");
  const [apyWindow, setApyWindow] = useState<"7d" | "30d">("30d");

  // Format data for Recharts
  const ppsData = pricePerShareSeries.map((pt) => ({
    time: new Date(pt.t).toLocaleDateString(),
    pps: pt.pps,
  }));

  const apyData = apySeries
    .slice(apyWindow === "7d" ? -7 : -30)
    .map((pt) => ({
      time: new Date(pt.t).toLocaleDateString(),
      apy: pt.apy,
    }));

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-primary">Derivations & Charts</h2>
          <Badge variant="outline" className="text-xs">
            Derived from events
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pps" | "apy")}>
        <TabsList className="mb-4">
          <TabsTrigger value="pps">Price per Share</TabsTrigger>
          <TabsTrigger value="apy">APY (Rolling)</TabsTrigger>
        </TabsList>

        <TabsContent value="pps">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ppsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  label={{
                    value: "Price per Share (SOL)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "hsl(var(--primary))",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="pps"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price per Share"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Price per Share = Total Assets / Token Supply. Increases from repayments, stable 1:1 on
            deposits.
          </p>
        </TabsContent>

        <TabsContent value="apy">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setApyWindow("7d")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                apyWindow === "7d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setApyWindow("30d")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                apyWindow === "30d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              30d
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  label={{
                    value: "APY (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "hsl(var(--accent))",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="apy"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                  name="APY"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Rolling APY calculated from PPS change over trailing window, annualized. Formula: (PPS_now /
            PPS_lag - 1) × (365/30).
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
