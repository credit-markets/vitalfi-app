"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { getStatusColors } from "@/lib/utils/colors";
import { formatDate, daysUntil, expectedYieldSol, cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { PortfolioPosition } from "@/hooks/vault/use-portfolio-api";

interface PositionCardProps {
  position: PortfolioPosition;
  onClaim?: (vaultId: string) => void;
  claimPending?: boolean;
}

/**
 * Position card showing vault investment with timeline and projected/realized returns
 */
export function PositionCard({ position, onClaim, claimPending }: PositionCardProps) {
  const {
    vaultId,
    vaultName,
    status,
    depositedSol,
    expectedApyPct,
    fundingEndAt,
    maturityAt,
    realizedYieldSol,
    realizedTotalSol,
    canClaim,
    claimTxSig,
  } = position;

  // Calculate timeline status text
  let timelineText = "";

  if (status === 'Funding') {
    const daysToFundingEnd = daysUntil(fundingEndAt);
    timelineText = `Funding ends in ${daysToFundingEnd} ${daysToFundingEnd === 1 ? 'day' : 'days'}`;
  } else if (status === 'Active') {
    const daysToMaturity = daysUntil(maturityAt);
    timelineText = `Maturity in ${daysToMaturity} ${daysToMaturity === 1 ? 'day' : 'days'}`;
  } else {
    timelineText = "Vault Matured — ready to redeem";
  }

  // Calculate expected or realized values
  const expectedYield = expectedYieldSol(depositedSol, expectedApyPct, maturityAt);
  const expectedTotal = depositedSol + expectedYield;

  return (
    <Card className="p-5 sm:p-6 bg-gradient-card border-border/50">
      <div className="space-y-5">
        {/* Header: Vault name + Stage */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-bold leading-tight">{vaultName}</h3>
          <Badge
            variant="outline"
            className={cn("flex-shrink-0", getStatusColors(status))}
          >
            {status}
          </Badge>
        </div>

        {/* Investment Summary - Hide for Matured */}
        {status !== 'Matured' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Deposited</div>
                <div className="font-semibold">{formatCompactCurrency(depositedSol)} SOL</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Expected APY</div>
                <div className="font-semibold">{expectedApyPct.toFixed(1)}% p.y.</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Maturity Date</div>
                <div className="font-semibold">{formatDate(maturityAt)}</div>
              </div>
            </div>

            {/* Timeline Status Text - No bar */}
            <div className="text-sm text-muted-foreground">{timelineText}</div>
          </>
        ) : (
          /* Spacer for Matured card to match height */
          <div className="text-sm text-muted-foreground">{timelineText}</div>
        )}

        {/* Projected / Realized Return Panel */}
        <div className="border border-border rounded-lg p-4 bg-muted/10">
          <div className="text-sm font-semibold mb-3">
            {status === 'Matured' && realizedYieldSol !== undefined
              ? "Realized Return"
              : "Projected Return (at Maturity)"}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal</span>
              <span className="font-medium">{formatCompactCurrency(depositedSol)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {status === 'Matured' && realizedYieldSol !== undefined ? "Yield Earned" : "Expected Yield"}
              </span>
              <span className="font-medium text-green-500">
                +{formatCompactCurrency(realizedYieldSol ?? expectedYield)} SOL
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-accent">
                {formatCompactCurrency(realizedTotalSol ?? expectedTotal)} SOL
              </span>
            </div>
          </div>
        </div>

        {/* Claim CTA (only when matured) */}
        {status === 'Matured' && (
          <>
            {claimTxSig ? (
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="text-sm text-green-500 font-medium">Claimed Successfully</span>
                <a
                  href={`https://explorer.solana.com/tx/${claimTxSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  View Tx
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <Button
                className="w-full text-sm"
                disabled={!canClaim || claimPending}
                onClick={() => onClaim?.(vaultId)}
              >
                {claimPending ? "Processing..." : canClaim ? "Claim" : "Claim Not Available"}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
