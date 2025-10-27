"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMonetary, formatMonetaryPrecise } from "@/lib/utils/formatters";
import { formatDate, daysUntil, expectedYieldSol, cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import type { PortfolioPosition } from "@/hooks/vault/use-portfolio-api";
import { getTokenSymbol } from "@/lib/sdk/config";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  getPositionStage,
  getStageBadgeText,
  getStageBadgeColors,
  getStateLineText,
  getOutcomeTitle,
} from "@/lib/portfolio/position-stage";

export interface PositionCardProps {
  position: PortfolioPosition;
  onClaim?: (vaultId: string) => void;
  onRefund?: (vaultId: string) => void;
  onViewVault?: (vaultId: string) => void;
  claimPending?: boolean;
  className?: string;
}

/**
 * Unified position card showing all vault states (funding, matured, canceled)
 * Renders one of five visual variants based on position stage
 */
export function PositionCard({
  position,
  onClaim,
  onRefund,
  onViewVault,
  claimPending,
  className,
}: PositionCardProps) {
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
  } = position;

  // Get token symbol for display
  const tokenMint = position.assetMint || NATIVE_MINT.toBase58();
  const tokenSymbol = getTokenSymbol(tokenMint);

  // Determine position stage
  const hasClaimed = (status === 'Matured' || status === 'Canceled') && !canClaim;
  const stage = getPositionStage(status, hasClaimed);

  // Calculate expected values for funding stage
  const expectedYield = expectedYieldSol(depositedSol, expectedApyPct, maturityAt, fundingEndAt);
  const expectedTotal = depositedSol + expectedYield;

  // Calculate realized APR for matured positions
  const realizedApyPct = realizedYieldSol !== undefined && depositedSol > 0
    ? (realizedYieldSol / depositedSol) * 100
    : undefined;

  // Calculate funding end days for state line
  const fundingEndsInDays = status === 'Funding' || status === 'Active' ? daysUntil(fundingEndAt) : undefined;

  return (
    <Card className={cn("p-5 flex flex-col min-h-[400px] bg-gradient-card border-border/50", className)}>
      <div className="flex flex-col gap-4 flex-1">
        {/* Header: Vault name + Stage Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 flex-1">
            {vaultName || `Vault #${vaultId}`}
          </h3>
          <Badge
            variant="outline"
            className={cn("flex-shrink-0 whitespace-nowrap", getStageBadgeColors(stage))}
            aria-label={`Stage: ${getStageBadgeText(stage)}`}
          >
            {getStageBadgeText(stage)}
          </Badge>
        </div>

        {/* Key Stats (3 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Deposited</div>
            <div
              className="font-semibold"
              title={formatMonetaryPrecise(depositedSol, tokenSymbol)}
            >
              {formatMonetary(depositedSol, tokenSymbol)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">
              {stage === 'matured-claimable' || stage === 'matured-claimed' ? 'Final APR' : 'Expected APR'}
            </div>
            <div className="font-semibold">
              {stage === 'canceled-refundable' || stage === 'canceled-refunded' || stage === 'closed'
                ? '—'
                : stage === 'matured-claimable' || stage === 'matured-claimed'
                ? `${(realizedApyPct ?? expectedApyPct).toFixed(1)}% p.y.`
                : `${expectedApyPct.toFixed(1)}% p.y.`}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Maturity</div>
            <div className="font-semibold">
              {stage === 'canceled-refundable' || stage === 'canceled-refunded' || stage === 'closed'
                ? '—'
                : formatDate(maturityAt)}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* State Line */}
        <div className="text-sm text-muted-foreground">
          {getStateLineText(stage, fundingEndsInDays)}
        </div>

        {/* Outcome Summary (Financial Panel) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/10">
          <div className="text-sm font-semibold mb-3">{getOutcomeTitle(stage)}</div>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Principal</span>
              <span
                className="font-medium text-right"
                title={formatMonetaryPrecise(depositedSol, tokenSymbol)}
              >
                {formatMonetary(depositedSol, tokenSymbol)}
              </span>
            </div>

            {/* Only show yield rows for funding/matured stages */}
            {(stage === 'funding' ||
              stage === 'matured-claimable' ||
              stage === 'matured-claimed') && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">
                  {stage === 'funding' ? 'Expected Yield' : 'Yield Earned'}
                </span>
                <span
                  className="font-medium text-right text-green-500"
                  title={formatMonetaryPrecise(
                    realizedYieldSol ?? expectedYield,
                    tokenSymbol
                  )}
                >
                  +{formatMonetary(realizedYieldSol ?? expectedYield, tokenSymbol)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <span className="font-semibold">Total</span>
              <span
                className="font-bold text-accent text-right"
                title={formatMonetaryPrecise(
                  stage === 'canceled-refundable' || stage === 'canceled-refunded' || stage === 'closed'
                    ? depositedSol
                    : realizedTotalSol ?? expectedTotal,
                  tokenSymbol
                )}
              >
                {formatMonetary(
                  stage === 'canceled-refundable' || stage === 'canceled-refunded' || stage === 'closed'
                    ? depositedSol
                    : realizedTotalSol ?? expectedTotal,
                  tokenSymbol
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Row (bottom-aligned) */}
        <div className="flex items-center justify-end gap-3 mt-auto pt-2">
          {/* Funding: only "View Vault" link */}
          {stage === 'funding' && onViewVault && (
            <button
              onClick={() => onViewVault(vaultId)}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              View Vault <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Matured Claimable: Primary Claim button */}
          {stage === 'matured-claimable' && (
            <Button
              onClick={() => onClaim?.(vaultId)}
              disabled={claimPending}
              className="flex-1 sm:flex-none"
              aria-label={`Claim funds for ${vaultName || vaultId}`}
            >
              {claimPending ? 'Processing...' : 'Claim'}
            </Button>
          )}

          {/* Matured Claimed: Claimed tag + View link */}
          {stage === 'matured-claimed' && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Claimed</span>
              </div>
              {onViewVault && (
                <button
                  onClick={() => onViewVault(vaultId)}
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  View Vault <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Canceled Refundable: Primary Refund button */}
          {stage === 'canceled-refundable' && (
            <Button
              onClick={() => onRefund?.(vaultId)}
              disabled={claimPending}
              className="flex-1 sm:flex-none"
              aria-label={`Refund deposit for ${vaultName || vaultId}`}
            >
              {claimPending ? 'Processing...' : 'Refund'}
            </Button>
          )}

          {/* Canceled Refunded: Refunded tag + View link */}
          {stage === 'canceled-refunded' && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Refunded</span>
              </div>
              {onViewVault && (
                <button
                  onClick={() => onViewVault(vaultId)}
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  View Vault <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Closed: Closed tag + View link */}
          {stage === 'closed' && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border/50 rounded-md">
                <Check className="w-4 h-4 text-muted-foreground/70" />
                <span className="text-sm text-muted-foreground/70 font-medium">Closed</span>
              </div>
              {onViewVault && (
                <button
                  onClick={() => onViewVault(vaultId)}
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  View Vault <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
