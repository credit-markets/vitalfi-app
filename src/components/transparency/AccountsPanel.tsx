"use client";

import { Card } from "@/components/ui/card";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AccountsPanelProps {
  addresses: {
    programId: string;
    vaultPda: string;
    authorityPda: string;
    tokenMint: string;
    vaultTokenAccount: string;
  };
}

export function AccountsPanel({ addresses }: AccountsPanelProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  const getSolscanUrl = (address: string, type: "address" | "token" = "address") => {
    return `https://explorer.solana.com/${type}/${address}?cluster=devnet`;
  };

  const accounts = [
    { label: "Program ID", key: "programId", type: "address" as const },
    { label: "Vault PDA", key: "vaultPda", type: "address" as const },
    { label: "Authority PDA", key: "authorityPda", type: "address" as const },
    { label: "Vault Token Mint (vTOK)", key: "tokenMint", type: "token" as const },
    { label: "Asset Account (wSOL)", key: "vaultTokenAccount", type: "address" as const },
  ];

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <h2 className="text-xl font-bold text-primary mb-4">On-Chain Accounts</h2>
      <div className="space-y-3">
        {accounts.map((account) => {
          const address = addresses[account.key as keyof typeof addresses];
          return (
            <div key={account.key} className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{account.label}</span>
              <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                <code className="text-xs flex-1 font-mono text-primary/80 break-all">
                  {address}
                </code>
                <button
                  onClick={() => copyToClipboard(address, account.label)}
                  className="p-2 hover:bg-primary/10 rounded transition-colors flex-shrink-0"
                  aria-label="Copy address"
                >
                  <Copy className="w-4 h-4 text-primary" />
                </button>
                <a
                  href={getSolscanUrl(address, account.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-primary/10 rounded transition-colors flex-shrink-0"
                  aria-label="View on Solscan"
                >
                  <ExternalLink className="w-4 h-4 text-accent" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
