"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Copy, ExternalLink, ChevronDown, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { shortenAddress, formatNumber } from "@/lib/utils";
import type { LegacyVaultEvent, LegacyEventTag } from "@/types/vault";

interface EventInspectorProps {
  events: LegacyVaultEvent[];
  onDownload: () => void;
}

export function EventInspector({ events, onDownload }: EventInspectorProps) {
  const [selectedTags, setSelectedTags] = useState<Set<LegacyEventTag>>(new Set());
  const [walletFilter, setWalletFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const allTags: LegacyEventTag[] = ["Deposit", "WithdrawRequest", "Claim", "Repayment", "Params"];

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Tag filter
      if (selectedTags.size > 0 && !selectedTags.has(ev.tag)) return false;
      // Wallet filter
      if (walletFilter && !ev.wallet.toLowerCase().includes(walletFilter.toLowerCase()))
        return false;
      return true;
    });
  }, [events, selectedTags, walletFilter]);

  const toggleTag = (tag: LegacyEventTag) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedTags(newSet);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  const getTagColor = (tag: LegacyEventTag) => {
    switch (tag) {
      case "Deposit":
        return "default";
      case "WithdrawRequest":
        return "secondary";
      case "Claim":
        return "outline";
      case "Repayment":
        return "default";
      case "Params":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary">Event Inspector</h2>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Download JSON</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Tag Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Filter by Tag</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedTags.has(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="px-3 py-1 rounded text-sm bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Wallet Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Filter by Wallet</label>
          <Input
            placeholder="Search wallet address..."
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Table */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Assets Δ (SOL)</TableHead>
                <TableHead className="text-right">Shares Δ</TableHead>
                <TableHead className="w-24">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <>
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedRow(expandedRow === event.id ? null : event.id)
                    }
                  >
                    <TableCell>
                      {expandedRow === event.id ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {new Date(event.ts).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTagColor(event.tag)} className="text-xs">
                        {event.tag}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {shortenAddress(event.wallet, 4)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {event.amountSol !== undefined
                        ? `${event.amountSol >= 0 ? "+" : ""}${formatNumber(event.amountSol, 0)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {event.shares !== undefined
                        ? `${event.shares >= 0 ? "+" : ""}${formatNumber(event.shares, 0)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(event.txUrl.split("/tx/")[1].split("?")[0], "Tx");
                          }}
                          className="p-1 hover:bg-primary/10 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-primary" />
                        </button>
                        <a
                          href={event.txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-primary/10 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-accent" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === event.id && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={7} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              Raw Event Data
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(JSON.stringify(event, null, 2), "Event JSON")
                              }
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs transition-colors"
                            >
                              Copy JSON
                            </button>
                          </div>
                          <pre className="bg-background/50 p-4 rounded text-xs font-mono overflow-x-auto">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                          {event.note && (
                            <div className="pt-2">
                              <span className="text-xs text-muted-foreground">Note: </span>
                              <span className="text-xs text-foreground">{event.note}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
