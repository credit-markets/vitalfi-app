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
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils";
import { shortenAddress } from "@/lib/utils";
import { Copy, ExternalLink, TrendingUp, DollarSign, Download } from "lucide-react";
import { toast } from "sonner";
import type { PortfolioActivity } from "@/hooks/vault/use-portfolio-api";

interface ActivityTableProps {
  activity: PortfolioActivity[];
}

type ActivityFilter = "all" | "Deposit" | "Claim";

/**
 * Activity table with maturity model columns: Type | Amount | Stage | Date | Transaction | Status
 * No PPS, shares, or unlock columns
 */
export function ActivityTable({ activity }: ActivityTableProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const filteredActivity =
    filter === "all" ? activity : activity.filter((a) => a.type === filter);

  const copyTxSig = (txSig: string) => {
    navigator.clipboard.writeText(txSig);
    toast.success("Transaction signature copied");
  };

  const exportCSV = () => {
    const headers = ["Type", "Amount (SOL)", "Vault", "Stage", "Date", "Status", "Tx Signature"];
    const rows = filteredActivity.map((a) => [
      a.type,
      a.amountSol.toString(),
      a.vaultName,
      a.stage,
      new Date(a.date).toLocaleString(),
      a.status,
      a.txSig,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Activity exported to CSV");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "Deposit" ? TrendingUp : DollarSign;
  };

  const getTypeColor = (type: string) => {
    return type === "Deposit" ? "text-accent" : "text-primary";
  };

  return (
    <Card className="p-4 sm:p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-semibold">Activity</h3>
        <div className="flex items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
            <TabsList className="h-8 sm:h-9">
              <TabsTrigger value="all" className="text-xs px-3 touch-manipulation">
                All
              </TabsTrigger>
              <TabsTrigger value="Deposit" className="text-xs px-3 touch-manipulation">
                Deposits
              </TabsTrigger>
              <TabsTrigger value="Claim" className="text-xs px-3 touch-manipulation">
                Claims
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <button
            onClick={exportCSV}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Amount (SOL)</TableHead>
                <TableHead className="text-xs">Vault</TableHead>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No activity found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivity.map((activity, idx) => {
                  const Icon = getTypeIcon(activity.type);
                  const color = getTypeColor(activity.type);

                  return (
                    <TableRow key={`${activity.txSig}-${idx}`} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-xs sm:text-sm font-medium">{activity.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        {formatCompactCurrency(activity.amountSol)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate">
                        {activity.vaultName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {activity.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono">
                            {shortenAddress(activity.txSig, 4)}
                          </code>
                          <button
                            onClick={() => copyTxSig(activity.txSig)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy transaction signature"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <a
                            href={`https://explorer.solana.com/tx/${activity.txSig}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="View on Solana Explorer"
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
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
      </div>

      {filteredActivity.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Showing {filteredActivity.length} {filteredActivity.length === 1 ? "transaction" : "transactions"}
        </div>
      )}
    </Card>
  );
}
