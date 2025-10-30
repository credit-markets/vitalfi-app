/**
 * Mint Devnet USDT Component
 * One-click USDT minting for testers on devnet
 */

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Loader2 } from "lucide-react";
import { env } from "@/lib/env";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function MintDevnetUSDT() {
  const { publicKey } = useWallet();
  const [isMinting, setIsMinting] = useState(false);

  const isDevnet = env.solanaNetwork === "devnet";

  if (!isDevnet) {
    return null; // Only show on devnet
  }

  const handleMint = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      const response = await fetch(`${env.backendUrl}/api/faucet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Faucet request failed");
      }

      toast.success(`Successfully minted ${data.amount} USDT!`, {
        description: "Check your wallet balance",
      });
    } catch (error) {
      console.error("Mint error:", error);
      toast.error("Failed to mint USDT", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card className="p-4 bg-amber-500/5 border-amber-500/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
          <Coins className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Need Test USDT?
          </h3>
          <p className="text-xs text-muted-foreground">
            Get 1,000 USDT instantly for testing
          </p>
        </div>
        <Button
          onClick={handleMint}
          disabled={isMinting || !publicKey}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
        >
          {isMinting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Minting...
            </>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-2" />
              Mint 1000 USDT
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
