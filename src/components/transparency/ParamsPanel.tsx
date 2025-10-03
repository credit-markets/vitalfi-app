"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { ExternalLink, Info } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface ParamsPanelProps {
  stats: {
    cap: number;
    capRemaining: number;
    liquidityBuffer: number;
    tvl: number;
    lastRepaymentAt: string;
    nextRepaymentEta?: string;
  };
  addresses: {
    vaultPda: string;
  };
}

export function ParamsPanel({ stats, addresses }: ParamsPanelProps) {
  const getSolscanUrl = (address: string) => {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
  };

  const params = [
    {
      label: "Principal Lockup",
      value: "90 days",
      tooltip: "Minimum period before principal can be withdrawn after deposit",
      solscan: false,
    },
    {
      label: "Withdrawal Delay",
      value: "2 days",
      tooltip: "Queue time from withdrawal request to claim availability",
      solscan: false,
    },
    {
      label: "Liquidity Buffer",
      value: `${formatCurrency(stats.liquidityBuffer, 0)} (${formatPercentage(
        (stats.liquidityBuffer / stats.tvl) * 100,
        1
      )})`,
      tooltip: "Reserve SOL kept liquid for immediate withdrawals",
      solscan: true,
    },
    {
      label: "Vault Cap",
      value: formatCurrency(stats.cap, 0),
      tooltip: "Maximum total value locked allowed in the vault",
      solscan: false,
    },
    {
      label: "Cap Remaining",
      value: formatCurrency(stats.capRemaining, 0),
      tooltip: "Available deposit capacity before hitting vault cap",
      solscan: false,
    },
    {
      label: "Last Repayment",
      value: new Date(stats.lastRepaymentAt).toLocaleDateString(),
      tooltip: `Full timestamp: ${new Date(stats.lastRepaymentAt).toISOString()}`,
      solscan: true,
    },
    {
      label: "Next Repayment ETA",
      value: stats.nextRepaymentEta
        ? new Date(stats.nextRepaymentEta).toLocaleDateString()
        : "TBD",
      tooltip: stats.nextRepaymentEta
        ? `Expected: ${new Date(stats.nextRepaymentEta).toISOString()}`
        : "Repayment schedule to be announced",
      solscan: false,
    },
  ];

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <h2 className="text-xl font-bold text-primary mb-4">Vault Parameters</h2>
      <div className="space-y-4">
        {params.map((param) => (
          <div key={param.label} className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{param.label}</span>
              <Tooltip content={<p className="text-sm">{param.tooltip}</p>}>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary font-mono">{param.value}</span>
              {param.solscan && (
                <a
                  href={getSolscanUrl(addresses.vaultPda)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-primary/10 rounded transition-colors"
                  aria-label="View on Solscan"
                >
                  <ExternalLink className="w-3 h-3 text-accent" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
