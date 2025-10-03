"use client";

import { useState } from "react";
import { formatCompactCurrency, formatSOL, formatRelativeTime } from "@/lib/formatters";
import type { CollateralSnapshot, CollateralStatus } from "@/types/vault";

interface CollateralOverviewProps {
  snapshot: CollateralSnapshot;
  tvl: number;
}

export function CollateralOverview({ snapshot, tvl }: CollateralOverviewProps) {
  const [filter, setFilter] = useState<"all" | CollateralStatus>("all");

  const filteredItems = filter === "all"
    ? snapshot.items
    : snapshot.items.filter(i => i.status === filter);

  const deployedPct = (snapshot.deployedSol / tvl) * 100;
  const bufferPct = (snapshot.liquidityBufferSol / tvl) * 100;
  const capPct = (snapshot.capRemainingSol / tvl) * 100;

  const exportCSV = () => {
    const headers = ["Asset", "Status", "Notional (SOL)", "Maturity", "Last Payment", "LTV"];
    const rows = filteredItems.map(item => [
      item.label,
      item.status,
      item.notionalSol,
      item.maturityAt ?? "",
      item.lastPaymentAt ?? "",
      item.ltv ? (item.ltv * 100).toFixed(1) + "%" : "",
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collateral-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collateral Overview</h2>
        <button
          onClick={exportCSV}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Stacked bar */}
      <div className="space-y-2">
        <div className="h-10 flex rounded-lg overflow-hidden border border-border">
          <div
            className="bg-violet-500/20 border-r border-border flex items-center justify-center text-xs font-medium"
            style={{ width: `${deployedPct}%` }}
          >
            {deployedPct > 15 && "Deployed"}
          </div>
          <div
            className="bg-teal-500/20 border-r border-border flex items-center justify-center text-xs font-medium"
            style={{ width: `${bufferPct}%` }}
          >
            {bufferPct > 10 && "Buffer"}
          </div>
          <div
            className="bg-slate-500/10 flex items-center justify-center text-xs font-medium"
            style={{ width: `${capPct}%` }}
          >
            {capPct > 10 && "Cap Remaining"}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Deployed: {formatSOL(snapshot.deployedSol, 0)} ({deployedPct.toFixed(1)}%)</span>
          <span>Buffer: {formatSOL(snapshot.liquidityBufferSol, 0)} ({bufferPct.toFixed(1)}%)</span>
          <span>Cap: {formatSOL(snapshot.capRemainingSol, 0)} ({capPct.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>All</FilterPill>
        <FilterPill active={filter === "performing"} onClick={() => setFilter("performing")}>Performing</FilterPill>
        <FilterPill active={filter === "matured"} onClick={() => setFilter("matured")}>Matured</FilterPill>
        <FilterPill active={filter === "repaid"} onClick={() => setFilter("repaid")}>Repaid</FilterPill>
        <FilterPill active={filter === "buffer"} onClick={() => setFilter("buffer")}>Buffer</FilterPill>
      </div>

      {/* Ledger table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asset</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Notional (SOL)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Maturity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Payment</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">LTV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.label}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCompactCurrency(item.notionalSol)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.maturityAt ? formatRelativeTime(item.maturityAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.lastPaymentAt ? formatRelativeTime(item.lastPaymentAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.ltv ? `${(item.ltv * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Collateral represents medical receivables originated in Brazil; buffer funds serve withdrawal liquidity.
      </p>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function StatusChip({ status }: { status: CollateralStatus }) {
  const colors: Record<CollateralStatus, string> = {
    performing: "bg-green-500/10 text-green-500 border-green-500/20",
    matured: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    repaid: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "in-default": "bg-red-500/10 text-red-500 border-red-500/20",
    buffer: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
