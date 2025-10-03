"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSeries } from "@/hooks/useSeries";
import { useVaultEvents } from "@/hooks/useVaultEvents";
import { useUserQueue } from "@/hooks/useUserQueue";
import { formatDelta, formatPricePerShare, formatCompactCurrency } from "@/lib/formatters";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { TrendingUp, Calendar, Clock } from "lucide-react";
import { useState } from "react";

/**
 * Option A: Three compact institutional widgets
 * - PPS Sparkline (30D trend with Δ%)
 * - Repayments Timeline (cadence visualization)
 * - Queue Timeline (user's withdrawal ETA)
 */
export function Visuals() {
  const [activeWidget, setActiveWidget] = useState<"pps" | "repayments" | "queue">("pps");
  const { pps30d } = useSeries();
  const { events } = useVaultEvents({ tag: "Repayment" });
  const queue = useUserQueue();

  // Calculate PPS change
  const currentPPS = pps30d[pps30d.length - 1]?.value || 1;
  const initialPPS = pps30d[0]?.value || 1;
  const ppsChange = ((currentPPS - initialPPS) / initialPPS) * 100;

  // Prepare sparkline data
  const sparklineData = pps30d.map((d) => ({
    value: d.value,
  }));

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Vault Metrics</h3>
        <Tabs value={activeWidget} onValueChange={(v) => setActiveWidget(v as "pps" | "repayments" | "queue")}>
          <TabsList className="h-8">
            <TabsTrigger value="pps" className="text-xs px-3">
              <TrendingUp className="w-3 h-3 mr-1" />
              PPS
            </TabsTrigger>
            <TabsTrigger value="repayments" className="text-xs px-3">
              <Calendar className="w-3 h-3 mr-1" />
              Repayments
            </TabsTrigger>
            <TabsTrigger value="queue" className="text-xs px-3">
              <Clock className="w-3 h-3 mr-1" />
              Queue
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* PPS Sparkline */}
      {activeWidget === "pps" && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Price per Share (30D)</div>
              <div className="text-3xl font-bold">{formatPricePerShare(currentPPS)}</div>
            </div>
            <div
              className={`text-sm font-semibold ${
                ppsChange >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatDelta(ppsChange)}
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => formatPricePerShare(value)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Repayments Timeline */}
      {activeWidget === "repayments" && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Recent Repayments (Last 30 Days)
          </div>
          <div className="flex items-end gap-1 h-20">
            {events.slice(0, 15).map((event) => {
              const maxAmount = Math.max(...events.slice(0, 15).map((e) => e.amountSol || 0));
              const height = ((event.amountSol || 0) / maxAmount) * 100;
              const date = new Date(event.ts);

              return (
                <div
                  key={event.id}
                  className="flex-1 bg-gradient-to-t from-accent to-primary/60 rounded-t hover:opacity-80 transition-opacity cursor-pointer group relative"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${date.toLocaleDateString()}: ${formatCompactCurrency(event.amountSol || 0)}`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10 pointer-events-none">
                    <div>{date.toLocaleDateString()}</div>
                    <div className="font-semibold">{formatCompactCurrency(event.amountSol || 0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {events.length} repayments • Avg {formatCompactCurrency(
              events.reduce((sum, e) => sum + (e.amountSol || 0), 0) / events.length
            )} per event
          </div>
        </div>
      )}

      {/* Queue Timeline */}
      {activeWidget === "queue" && (
        <div className="space-y-4">
          {queue.pending ? (
            <>
              <div className="text-xs text-muted-foreground">Your Withdrawal Request</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {queue.pending.amountShares.toFixed(2)} shares → {queue.pending.estSol.toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold ${queue.canClaim ? "text-green-500" : "text-accent"}`}>
                    {queue.countdown}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Requested</span>
                    <span>Claimable</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        queue.canClaim ? "bg-green-500" : "bg-accent"
                      }`}
                      style={{
                        width: queue.canClaim
                          ? "100%"
                          : `${Math.min(
                              ((Date.now() - new Date(queue.pending.claimAt).getTime() + 2 * 24 * 60 * 60 * 1000) /
                                (2 * 24 * 60 * 60 * 1000)) *
                                100,
                              95
                            )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-sm text-muted-foreground">No pending withdrawals</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average claim time: 2 days
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
