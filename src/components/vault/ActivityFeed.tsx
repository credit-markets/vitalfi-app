"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMockActivity } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, shortenAddress } from "@/lib/utils";
import { Copy, ExternalLink, TrendingUp, TrendingDown, DollarSign, Settings, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

type ActivityFilter = "all" | "deposit" | "withdraw" | "claim" | "yield_sell" | "repayment" | "params";

const filterLabels: Record<ActivityFilter, string> = {
  all: "All Activity",
  deposit: "Deposits",
  withdraw: "Withdraw Requests",
  claim: "Claims",
  yield_sell: "Yield Sells",
  repayment: "Repayments",
  params: "Param Changes",
};

const activityIcons: Record<string, any> = {
  deposit: TrendingUp,
  withdraw_request: TrendingDown,
  claim: DollarSign,
  yield_sell: ArrowUpRight,
  repayment: DollarSign,
  param_change: Settings,
};

const activityColors: Record<string, string> = {
  deposit: "text-accent",
  withdraw_request: "text-impact",
  claim: "text-primary",
  yield_sell: "text-secondary",
  repayment: "text-accent",
  param_change: "text-muted-foreground",
};

export function ActivityFeed() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const allActivity = getMockActivity();

  const filteredActivity = filter === "all"
    ? allActivity
    : allActivity.filter(a => {
        if (filter === "withdraw") return a.type === "withdraw_request";
        if (filter === "yield_sell") return a.type === "yield_sell";
        if (filter === "params") return a.type === "param_change";
        return a.type === filter;
      });

  const totals = filteredActivity.reduce((acc, activity) => {
    if (activity.type === "deposit") acc.deposits += activity.solAmount || 0;
    if (activity.type === "withdraw_request" || activity.type === "claim") acc.withdrawals += activity.solAmount || 0;
    if (activity.type === "yield_sell") acc.yieldSold += activity.vYTAmount || 0;
    return acc;
  }, { deposits: 0, withdrawals: 0, yieldSold: 0 });

  const copyTx = (sig: string) => {
    navigator.clipboard.writeText(sig);
    toast.success("Transaction signature copied!");
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  return (
    <Card className="p-8 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Activity Feed</h3>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deposit">Deposits</TabsTrigger>
            <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
            <TabsTrigger value="yield_sell">Yield</TabsTrigger>
            <TabsTrigger value="repayment">Repayments</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sticky Totals */}
      {filter !== "all" && (
        <Card className="p-4 bg-background/50 border-accent/20 mb-6">
          <div className="flex items-center gap-8 text-sm">
            {totals.deposits > 0 && (
              <div>
                <span className="text-muted-foreground">Total Deposits: </span>
                <span className="font-semibold text-accent">{formatCurrency(totals.deposits)}</span>
              </div>
            )}
            {totals.withdrawals > 0 && (
              <div>
                <span className="text-muted-foreground">Total Withdrawals: </span>
                <span className="font-semibold text-impact">{formatCurrency(totals.withdrawals)}</span>
              </div>
            )}
            {totals.yieldSold > 0 && (
              <div>
                <span className="text-muted-foreground">Total Yield Sold: </span>
                <span className="font-semibold text-secondary">{formatNumber(totals.yieldSold)} vYT</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Activity Table */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Transaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No activity found
                </TableCell>
              </TableRow>
            ) : (
              filteredActivity.map((activity) => {
                const Icon = activityIcons[activity.type] || DollarSign;
                const color = activityColors[activity.type] || "text-foreground";

                return (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <Badge variant="outline" className="capitalize">
                          {activity.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {activity.type === "deposit" && formatCurrency(activity.solAmount!)}
                      {(activity.type === "withdraw_request" || activity.type === "claim") &&
                        `${formatNumber(activity.vPTAmount!)} vPT`}
                      {activity.type === "yield_sell" &&
                        `${formatNumber(activity.vYTAmount!)} vYT → ${formatCurrency(activity.solAmount!)}`}
                      {activity.type === "repayment" && formatCurrency(activity.solAmount!)}
                      {activity.type === "param_change" && (
                        <span className="text-sm text-muted-foreground">{activity.paramName}: {activity.newValue}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-background/50 px-2 py-1 rounded">
                          {shortenAddress(activity.user)}
                        </code>
                        <button onClick={() => copyAddress(activity.user)}>
                          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {activity.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-background/50 px-2 py-1 rounded">
                          {shortenAddress(activity.signature, 3)}
                        </code>
                        <button onClick={() => copyTx(activity.signature)}>
                          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                        <a
                          href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
