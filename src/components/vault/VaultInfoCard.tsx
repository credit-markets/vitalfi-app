"use client";

import { Card } from "@/components/ui/card";
import { useVaultStats } from "@/hooks/useVaultStats";
import { formatCompactCurrency, formatPricePerShare } from "@/lib/formatters";
import { formatPercentage, shortenAddress } from "@/lib/utils";
import { SOLSCAN_BASE_URL, CLUSTER, WITHDRAWAL_DELAY_DAYS } from "@/lib/constants";
import { Copy, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

/**
 * Vault info card with addresses and stats
 * Includes copy buttons and Solscan links
 */
export function VaultInfoCard() {
  const stats = useVaultStats();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const addresses = [
    { label: "Program ID", value: stats.addresses.programId },
    { label: "Vault PDA", value: stats.addresses.vaultPda },
    { label: "Authority PDA", value: stats.addresses.authorityPda },
    { label: "Token Mint", value: stats.addresses.tokenMint },
    { label: "Asset Account", value: stats.addresses.vaultTokenAccount },
  ];

  const vaultStats = [
    { label: "TVL", value: formatCompactCurrency(stats.tvl) },
    { label: "APY", value: formatPercentage(stats.apy) },
    { label: "Price per Share", value: formatPricePerShare(stats.pricePerShare) },
    { label: "Cap Remaining", value: formatCompactCurrency(stats.capRemaining) },
    { label: "Liquidity Buffer", value: formatCompactCurrency(stats.liquidityBuffer) },
    { label: "Queue Depth", value: `${stats.queueDepth} requests` },
    { label: "Avg Claim Time", value: `${stats.avgClaimTimeDays} days` },
  ];

  return (
    <Card className="p-4 sm:p-6 bg-card border border-border space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">Vault Info</h3>
      </div>

      {/* Addresses Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Addresses
        </div>
        {addresses.map((addr) => (
          <div key={addr.label} className="space-y-1">
            <div className="text-[10px] sm:text-xs text-muted-foreground">{addr.label}</div>
            <div className="flex items-center gap-1 sm:gap-2">
              <code className="flex-1 text-[10px] sm:text-xs bg-muted/30 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded border border-border font-mono">
                {shortenAddress(addr.value, 6)}
              </code>
              <button
                onClick={() => copyToClipboard(addr.value, addr.label)}
                className="p-1.5 hover:bg-muted active:bg-muted rounded transition-colors touch-manipulation"
                aria-label={`Copy ${addr.label}`}
              >
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
              </button>
              <a
                href={`${SOLSCAN_BASE_URL}/account/${addr.value}${
                  CLUSTER !== "mainnet-beta" ? `?cluster=${CLUSTER}` : ""
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-muted active:bg-muted rounded transition-colors touch-manipulation"
                aria-label={`View ${addr.label} on Solscan`}
              >
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="pt-3 sm:pt-4 border-t border-border space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Statistics
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {vaultStats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-semibold">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="pt-3 sm:pt-4 border-t border-border space-y-2">
        <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Risk Parameters
        </div>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Withdrawal Delay</span>
            <span className="font-semibold">{WITHDRAWAL_DELAY_DAYS} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Principal Lockup</span>
            <span className="font-semibold">90 days</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
