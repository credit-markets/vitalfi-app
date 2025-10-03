"use client";

import { useState } from "react";
import { formatSOL, formatRelativeTime } from "@/lib/formatters";
import { SOLSCAN_BASE_URL, CLUSTER } from "@/lib/constants";
import { Tooltip } from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";
import type { VaultStats, ParamChange } from "@/types/vault";

interface ParametersPanelProps {
  stats: VaultStats;
  paramChanges: ParamChange[];
}

export function ParametersPanel({ stats, paramChanges }: ParametersPanelProps) {
  const [showChangeLog, setShowChangeLog] = useState(false);

  const recentChanges = paramChanges.slice(0, 5);

  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <h2 className="text-lg font-semibold">Parameters</h2>

      {/* Current values */}
      <div className="space-y-4">
        <Param
          label="Principal Lockup"
          value="90 days"
          tooltip="Duration each deposit lot is locked before becoming withdrawable."
        />
        <Param
          label="Withdrawal Delay"
          value="2 days"
          tooltip="Time between withdraw request and claim availability."
        />
        <Param
          label="Liquidity Buffer"
          value={`${formatSOL(stats.liquidityBuffer, 0)} (${((stats.liquidityBuffer / stats.tvl) * 100).toFixed(2)}%)`}
          tooltip="Cash buffer held in wSOL to satisfy immediate withdrawals."
        />
        <Param
          label="Vault Cap"
          value={formatSOL(stats.cap, 0)}
          tooltip="Maximum total deposits allowed in the vault."
        />
        <Param
          label="Cap Remaining"
          value={formatSOL(stats.capRemaining, 0)}
          tooltip="Additional capacity available before hitting vault cap."
        />
        <Param
          label="Last Repayment"
          value={formatRelativeTime(stats.lastRepaymentAt)}
          tooltip="Most recent repayment received from underlying receivables."
        />
      </div>

      {/* Change log toggle */}
      <button
        onClick={() => setShowChangeLog(!showChangeLog)}
        className="w-full text-xs text-primary hover:underline font-medium text-left"
      >
        {showChangeLog ? "Hide" : "Show"} change log ({paramChanges.length})
      </button>

      {/* Change log */}
      {showChangeLog && (
        <div className="space-y-2 pt-2 border-t border-border">
          {recentChanges.map((change) => (
            <div
              key={change.id}
              className="text-xs flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30"
            >
              <div className="flex-1 space-y-1">
                <div className="font-medium">{change.key}</div>
                <div className="text-muted-foreground">
                  {String(change.oldValue)} → {String(change.newValue)}
                </div>
                <div className="text-muted-foreground">{formatRelativeTime(change.ts)}</div>
              </div>
              <a
                href={`${SOLSCAN_BASE_URL}/tx/${change.txUrl.split("/").pop()?.split("?")[0]}?cluster=${CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
          {paramChanges.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Showing 5 of {paramChanges.length} changes
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Param({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <Tooltip
        content={<p className="text-xs">{tooltip}</p>}
      >
        <span className="text-sm text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
          {label}
        </span>
      </Tooltip>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
