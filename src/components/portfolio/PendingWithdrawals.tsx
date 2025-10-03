"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PendingWithdrawal } from "@/types/vault";
import { formatNumber } from "@/lib/utils";
import { formatCountdown } from "@/lib/formatters";
import { Clock, ExternalLink, ArrowRight } from "lucide-react";

interface PendingWithdrawalsProps {
  items: PendingWithdrawal[];
  onClaim: (id: string) => Promise<boolean>;
}

/**
 * Pending Withdrawals card
 * Shows list of pending withdrawal requests with claim buttons
 */
export function PendingWithdrawals({ items, onClaim }: PendingWithdrawalsProps) {
  const router = useRouter();

  // Empty state
  if (items.length === 0) {
    return (
      <Card className="p-6 bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-semibold">Pending Withdrawals</h3>
        </div>
        <div className="py-8 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground mb-4">No pending withdrawals</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            Request on Vault page
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Pending Withdrawals</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const claimAtDate = new Date(item.claimAt);
          const canClaim = claimAtDate.getTime() <= Date.now();
          const countdown = canClaim ? "Ready to claim" : formatCountdown(claimAtDate);

          return (
            <Card key={item.id} className="p-4 bg-muted/20 border-border">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {formatNumber(item.amount, 2)} shares
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ {formatNumber(item.estSolOut, 2)} SOL
                    </div>
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      canClaim ? "text-green-500" : "text-accent"
                    }`}
                  >
                    {countdown}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!canClaim}
                    onClick={() => onClaim(item.id)}
                  >
                    {canClaim ? `Claim ${formatNumber(item.estSolOut, 2)} SOL` : "Claim Available Soon"}
                  </Button>
                  {item.txUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.txUrl, "_blank")}
                      className="px-3"
                      aria-label="View transaction"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {!canClaim && (
                  <div className="text-xs text-muted-foreground">
                    Claim at {claimAtDate.toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
