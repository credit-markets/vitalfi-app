"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PortfolioEvent, PortfolioEventTag } from "@/types/vault";
import { formatNumber, shortenAddress } from "@/lib/utils";
import { formatRelativeTime, formatPricePerShare } from "@/lib/formatters";
import { Copy, ExternalLink, Download, TrendingUp, TrendingDown, Check } from "lucide-react";
import { toast } from "sonner";

interface ActivityTableProps {
  events: PortfolioEvent[];
}

type FilterTab = "All" | PortfolioEventTag;

/**
 * Your Activity table
 * Shows user's deposits, withdrawals, and claims with CSV export
 */
export function ActivityTable({ events }: ActivityTableProps) {
  const [filter, setFilter] = useState<FilterTab>("All");

  const filteredEvents = filter === "All"
    ? events
    : events.filter((e) => e.tag === filter);

  const getEventIcon = (tag: PortfolioEventTag) => {
    switch (tag) {
      case "Deposit":
        return TrendingUp;
      case "WithdrawRequest":
        return TrendingDown;
      case "Claim":
        return Check;
    }
  };

  const getEventColor = (tag: PortfolioEventTag) => {
    switch (tag) {
      case "Deposit":
        return "text-green-500";
      case "WithdrawRequest":
        return "text-yellow-500";
      case "Claim":
        return "text-primary";
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const exportCsv = () => {
    const headers = ["Type", "Amount SOL", "Shares", "PPS", "Date", "Status", "Transaction"];
    const rows = filteredEvents.map((e) => [
      e.tag,
      e.amountSol?.toString() || "",
      e.shares?.toString() || "",
      e.ppsAt?.toString() || "",
      new Date(e.ts).toISOString(),
      e.status || "success",
      e.txUrl,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-semibold">Your Activity</h3>
        <div className="flex items-center gap-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="All" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="Deposit" className="text-xs px-3">Deposits</TabsTrigger>
              <TabsTrigger value="WithdrawRequest" className="text-xs px-3">Withdrawals</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCsv}
            className="gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Amount (SOL)</TableHead>
                <TableHead className="text-xs text-right">Shares</TableHead>
                <TableHead className="text-xs text-right">PPS at Tx</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Transaction</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No activity found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => {
                  const Icon = getEventIcon(event.tag);
                  const color = getEventColor(event.tag);

                  return (
                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                          <span className="text-xs font-medium capitalize">
                            {event.tag === "WithdrawRequest" ? "Withdraw Req" : event.tag}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {event.amountSol ? formatNumber(event.amountSol, 2) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {event.shares ? (
                          <span className={event.tag === "Deposit" ? "text-green-500" : ""}>
                            {event.tag === "Deposit" ? "+" : ""}
                            {formatNumber(event.shares, 2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {event.ppsAt ? formatPricePerShare(event.ppsAt) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.ts)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono">
                            {shortenAddress(event.txUrl.split("/tx/")[1]?.split("?")[0] || "", 4)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(event.txUrl, "Transaction hash")}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            aria-label="Copy transaction hash"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <a
                            href={event.txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-muted rounded transition-colors"
                            aria-label="View on Solscan"
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.status === "pending" ? "outline" : "default"}
                          className={event.status === "success" ? "bg-green-500/10 text-green-500 border-green-500/30" : ""}
                        >
                          {event.status || "success"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredEvents.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {filteredEvents.length} {filteredEvents.length === 1 ? "transaction" : "transactions"}
        </div>
      )}
    </Card>
  );
}
