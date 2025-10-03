"use client";

import { useState, useMemo } from "react";
import { Copy, ExternalLink, ChevronDown, ChevronRight, Check } from "lucide-react";
import { formatSOL, formatRelativeTime } from "@/lib/formatters";
import { SOLSCAN_BASE_URL, CLUSTER } from "@/lib/constants";
import type { VaultEvent, EventTag } from "@/types/vault";

interface EventFeedProps {
  events: VaultEvent[];
  defaultFilters?: EventTag[];
}

export function EventFeed({ events, defaultFilters = ["Repayment", "Claim"] }: EventFeedProps) {
  const [selectedTags, setSelectedTags] = useState<Set<EventTag>>(new Set(defaultFilters));
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [walletFilter, setWalletFilter] = useState("");
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const allTags: EventTag[] = ["Deposit", "WithdrawRequest", "Claim", "Repayment", "Params"];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedTags.size > 0 && !selectedTags.has(event.tag)) return false;
      if (walletFilter && !event.wallet.toLowerCase().includes(walletFilter.toLowerCase())) return false;
      if (dateRange.start && new Date(event.ts) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(event.ts) > new Date(dateRange.end)) return false;
      if (amountRange.min && (event.amountSol ?? 0) < parseFloat(amountRange.min)) return false;
      if (amountRange.max && (event.amountSol ?? 0) > parseFloat(amountRange.max)) return false;
      return true;
    });
  }, [events, selectedTags, walletFilter, dateRange, amountRange]);

  const toggleTag = (tag: EventTag) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedTags(newSet);
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vault-events-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Event Feed</h2>
        <button
          onClick={downloadJSON}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          Download JSON ({filteredEvents.length})
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tag filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded border transition-all ${
                  selectedTags.has(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-accent"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs rounded border border-border bg-card"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs rounded border border-border bg-card"
            />
          </div>
        </div>

        {/* Wallet filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Wallet Contains</label>
          <input
            type="text"
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            placeholder="Search wallet..."
            className="w-full px-3 py-1.5 text-xs rounded border border-border bg-card"
          />
        </div>

        {/* Amount range */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Amount (SOL)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amountRange.min}
              onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
              placeholder="Min"
              className="flex-1 px-2 py-1.5 text-xs rounded border border-border bg-card"
            />
            <input
              type="number"
              value={amountRange.max}
              onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
              placeholder="Max"
              className="flex-1 px-2 py-1.5 text-xs rounded border border-border bg-card"
            />
          </div>
        </div>
      </div>

      {/* Event table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wallet</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Δ Assets (SOL)</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Δ Shares</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isExpanded={expandedRows.has(event.id)}
                  onToggle={() => toggleRow(event.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No events match the current filters.
        </p>
      )}
    </section>
  );
}

function EventRow({ event, isExpanded, onToggle }: { event: VaultEvent; isExpanded: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyTxUrl = async () => {
    await navigator.clipboard.writeText(event.txUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 16) return wallet;
    return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
  };

  const tagColors: Record<EventTag, string> = {
    Deposit: "bg-green-500/10 text-green-500",
    WithdrawRequest: "bg-amber-500/10 text-amber-500",
    Claim: "bg-violet-500/10 text-violet-500",
    Repayment: "bg-teal-500/10 text-teal-500",
    Params: "bg-slate-500/10 text-slate-400",
  };

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-2">
          <button onClick={onToggle} className="p-1 hover:bg-accent rounded">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </td>
        <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(event.ts)}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagColors[event.tag]}`}>
            {event.tag}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-xs">{truncateWallet(event.wallet)}</td>
        <td className="px-4 py-3 text-right font-mono">
          {event.amountSol !== undefined ? formatSOL(event.amountSol, 2) : "—"}
        </td>
        <td className="px-4 py-3 text-right font-mono">
          {event.shares !== undefined ? event.shares.toLocaleString() : "—"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1">
            <button onClick={copyTxUrl} className="p-1 hover:bg-accent rounded" title="Copy tx URL">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`${SOLSCAN_BASE_URL}/tx/${event.txUrl.split("/").pop()?.split("?")[0]}?cluster=${CLUSTER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-accent rounded"
              title="View on Solscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-muted/20">
            <pre className="text-xs font-mono overflow-x-auto p-3 rounded bg-card border border-border">
              {JSON.stringify(event, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
