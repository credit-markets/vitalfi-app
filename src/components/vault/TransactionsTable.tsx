"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVaultEvents } from "@/hooks/useVaultEvents";
import { formatCompactCurrency, formatRelativeTime } from "@/lib/formatters";
import { shortenAddress } from "@/lib/utils";
import { Copy, ExternalLink, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "sonner";
import type { EventTag } from "@/types/vault";

type FilterTab = "All" | EventTag;

/**
 * Transactions table with filtering, sticky header, and Solscan links
 * Uniswap-like design with colored chips and hover affordances
 */
export function TransactionsTable() {
  const [filter, setFilter] = useState<FilterTab>("All");
  const { events } = useVaultEvents({ tag: filter });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const getEventIcon = (tag: EventTag) => {
    switch (tag) {
      case "Deposit":
        return TrendingUp;
      case "WithdrawRequest":
      case "Claim":
        return TrendingDown;
      case "Repayment":
        return DollarSign;
      default:
        return DollarSign;
    }
  };

  const getEventColor = (tag: EventTag) => {
    switch (tag) {
      case "Deposit":
        return "text-green-500";
      case "WithdrawRequest":
        return "text-yellow-500";
      case "Claim":
        return "text-primary";
      case "Repayment":
        return "text-accent";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="h-8">
            <TabsTrigger value="All" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="Deposit" className="text-xs px-3">Deposits</TabsTrigger>
            <TabsTrigger value="WithdrawRequest" className="text-xs px-3">Withdrawals</TabsTrigger>
            <TabsTrigger value="Repayment" className="text-xs px-3">Repayments</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Δ Assets</TableHead>
                <TableHead className="text-xs text-right">Δ Shares</TableHead>
                <TableHead className="text-xs">Wallet</TableHead>
                <TableHead className="text-xs">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const Icon = getEventIcon(event.tag);
                  const color = getEventColor(event.tag);

                  return (
                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.ts)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.tag.replace(/([A-Z])/g, " $1").trim()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {event.amountSol ? (
                          <span className={event.tag === "Deposit" ? "text-green-500" : ""}>
                            {event.tag === "Deposit" ? "+" : event.tag === "Claim" ? "-" : ""}
                            {formatCompactCurrency(event.amountSol)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {event.shares ? (
                          <span className={event.shares > 0 ? "text-green-500" : "text-red-500"}>
                            {event.shares > 0 ? "+" : ""}
                            {event.shares.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono">
                            {shortenAddress(event.wallet, 4)}
                          </code>
                          <button
                            onClick={() => copyAddress(event.wallet)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            aria-label="Copy wallet address"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={event.txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          aria-label="View transaction on Solana Explorer"
                        >
                          <code className="text-xs bg-muted/30 px-2 py-1 rounded">View</code>
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
      </div>

      {/* Pagination placeholder */}
      {events.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {events.length} transactions
        </div>
      )}
    </Card>
  );
}
