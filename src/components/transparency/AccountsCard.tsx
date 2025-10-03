"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { SOLSCAN_BASE_URL, CLUSTER } from "@/lib/constants";

interface AccountsCardProps {
  addresses: {
    programId: string;
    vaultPda: string;
    authorityPda: string;
    tokenMint: string;
    vaultTokenAccount: string;
  };
}

export function AccountsCard({ addresses }: AccountsCardProps) {
  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-6">
      <h2 className="text-lg font-semibold">Accounts</h2>

      <div className="space-y-3">
        <Account label="Program ID" address={addresses.programId} />
        <Account label="Vault PDA" address={addresses.vaultPda} />
        <Account label="Authority PDA" address={addresses.authorityPda} />
        <Account label="Token Mint" address={addresses.tokenMint} />
        <Account label="Asset Account (wSOL)" address={addresses.vaultTokenAccount} />
      </div>
    </section>
  );
}

function Account({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (str: string) => {
    if (str.length <= 16) return str;
    return `${str.slice(0, 8)}...${str.slice(-8)}`;
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-xs font-mono text-foreground truncate">{truncate(address)}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
        <a
          href={`${SOLSCAN_BASE_URL}/account/${address}?cluster=${CLUSTER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="View on Solscan"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
