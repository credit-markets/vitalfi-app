"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMockActivity } from "@/lib/solana/mock-data";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import { Copy, ExternalLink, TrendingUp, TrendingDown, DollarSign, LucideIcon } from "lucide-react";
import { toast } from "sonner";

type ActivityFilter = "all" | "deposits" | "withdrawals" | "repayments";

const activityIcons: Record<string, LucideIcon> = {
  deposit: TrendingUp,
  withdraw_request: TrendingDown,
  claim: DollarSign,
  repayment: DollarSign,
};

const activityColors: Record<string, string> = {
  deposit: "text-accent",
  withdraw_request: "text-impact",
  claim: "text-primary",
  repayment: "text-green-500",
};

export function ActivityFeed() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const allActivity = getMockActivity();

  const filteredActivity = filter === "all"
    ? allActivity
    : allActivity.filter(a => {
        if (filter === "deposits") return a.type === "deposit";
        if (filter === "withdrawals") return a.type === "withdraw_request" || a.type === "claim";
        if (filter === "repayments") return a.type === "repayment";
        return true;
      });

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  return (
    <Card className="p-8 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-2xl font-bold">Recent Activity</h3>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="repayments">Repayments</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
                        formatCurrency(activity.solAmount! * 1.02)}
                      {activity.type === "repayment" && formatCurrency(activity.solAmount!)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-background/50 px-2 py-1 rounded">
                          {shortenAddress(activity.user || "")}
                        </code>
                        <button onClick={() => copyAddress(activity.user || "")}>
                          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {activity.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        <code className="text-xs bg-background/50 px-2 py-1 rounded">
                          View
                        </code>
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
