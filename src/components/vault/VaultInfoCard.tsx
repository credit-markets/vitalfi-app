"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { shortenAddress } from "@/lib/utils";
import { SOLSCAN_BASE_URL, CLUSTER } from "@/lib/utils/constants";
import { Copy, ExternalLink, Info, Eye } from "lucide-react";
import { toast } from "sonner";

export interface VaultInfoCardProps {
  vaultId: string;
}

/**
 * Vault info card with addresses and facts
 * Shows: Originator, Cap, Min Investment
 */
export function VaultInfoCard({ vaultId }: VaultInfoCardProps) {
  const { info } = useVaultAPI(vaultId);

  // Early return if data not loaded (error state handled by parent)
  if (!info) {
    return null;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const addresses = [
    { label: "Program ID", value: info.addresses.programId },
    { label: "Vault PDA", value: info.addresses.vaultPda },
    { label: "Authority", value: info.addresses.authority },
    { label: "Token Mint", value: info.addresses.tokenMint },
    { label: "Asset Account", value: info.addresses.vaultTokenAccount },
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
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {addr.label}
            </div>
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

      {/* Transparency Link */}
      {vaultId && (
        <div className="pt-3 sm:pt-4 border-t border-border">
          <Link href={`/vault/${vaultId}/transparency`} className="block">
            <Button variant="outline" className="w-full border-foreground/30 hover:border-primary/50 hover:bg-primary/5">
              <Eye className="w-4 h-4 mr-2" />
              View Transparency
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
