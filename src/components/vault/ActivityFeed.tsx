"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { formatNumber, shortenAddress } from "@/lib/utils";
import { getTokenSymbol } from "@/lib/sdk/config";
import { NATIVE_MINT } from "@solana/spl-token";
import { Copy, ExternalLink, TrendingUp, DollarSign, LucideIcon } from "lucide-react";
import { copyAddress as copyAddressUtil } from "@/lib/toast";
import type { EventTag } from "@/types/vault";

type ActivityFilter = "all" | "deposits" | "claims";

const activityIcons: Record<EventTag, LucideIcon> = {
  Deposit: TrendingUp,
  Claim: DollarSign,
  Withdraw: DollarSign,
  System: DollarSign,
};

const activityColors: Record<EventTag, string> = {
  Deposit: "text-accent",
  Claim: "text-primary",
  Withdraw: "text-orange-500",
  System: "text-muted-foreground",
};

export interface ActivityFeedProps {
  vaultId: string;
}

/**
 * Transactions table
 * Shows deposits and claims only (no PPS, shares, queue columns)
 */
export function ActivityFeed({ vaultId }: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const { events, info } = useVaultAPI(vaultId);

  // Filter and sort events by timestamp (newest first)
  const filteredActivity = useMemo(() => {
    const filtered = filter === "all"
      ? events
      : events.filter(e => {
          if (filter === "deposits") return e.tag === "Deposit";
          if (filter === "claims") return e.tag === "Claim";
          return true;
        });

    // Sort by timestamp (newest first)
    return [...filtered].sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  }, [events, filter]);

  // Early return if data not loaded (error state handled by parent)
  if (!info) {
    return null;
  }

  const tokenSymbol = getTokenSymbol(info.addresses.tokenMint || NATIVE_MINT.toBase58());

  const copyAddress = async (addr: string) => {
    await copyAddressUtil(addr);
  };

  return (
    <Card className="p-6 sm:p-8 bg-gradient-card border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-xl sm:text-2xl font-bold">Transactions</h3>
        <div className="sm:ml-auto">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="claims" disabled={info.status !== 'Matured'}>
                Claims
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Time</TableHead>
                <TableHead className="min-w-[80px]">Type</TableHead>
                <TableHead className="min-w-[120px] text-right">Amount ({tokenSymbol})</TableHead>
                <TableHead className="min-w-[120px]">Wallet</TableHead>
                <TableHead className="min-w-[80px]">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No funding transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivity.map((event) => {
                  const Icon = activityIcons[event.tag];
                  const color = activityColors[event.tag];
                  const timestamp = new Date(event.ts);

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        <div>{timestamp.toLocaleDateString()}</div>
                        <div className="text-[10px] sm:text-xs">{timestamp.toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                          <Badge variant="outline" className="capitalize text-xs">
                            {event.tag}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        {formatNumber(event.amountSol)} {tokenSymbol}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-[10px] sm:text-xs bg-background/50 px-2 py-1 rounded font-mono">
                            {shortenAddress(event.wallet, 4)}
                          </code>
                          <button
                            onClick={() => copyAddress(event.wallet)}
                            className="p-1 hover:bg-muted active:bg-muted rounded transition-colors touch-manipulation"
                            aria-label="Copy address"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={event.txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <code className="text-[10px] sm:text-xs bg-background/50 px-2 py-1 rounded">
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
      </div>
    </Card>
  );
}
