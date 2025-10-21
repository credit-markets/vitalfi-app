"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { getStageColors } from "@/lib/utils/colors";
import { formatDate, pluralize, cn } from "@/lib/utils";

/**
 * Vault Overview with single gradient progress bar and 4-item info row
 * Header includes stage pill; no subordination or duplicate data
 */
export function VaultOverview() {
  const { info, computed } = useVaultAPI();

  // Early return if data not loaded (error state handled by parent)
  if (!info || !computed) {
    return null;
  }

  return (
    <Card className="p-6 sm:p-8 bg-gradient-card border-border/50">
      <div className="space-y-6">
        {/* Header: Title + Stage Pill */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-bold flex-1 min-w-0">{info.name}</h3>
          <Badge
            variant="outline"
            className={cn("flex-shrink-0", getStageColors(info.stage))}
          >
            {info.stage}
          </Badge>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="h-10 flex rounded-lg overflow-hidden border border-border">
            <div
              className="bg-gradient-to-r from-violet-500/20 to-cyan-400/30 border-r border-border flex items-center justify-center text-xs font-medium"
              style={{ width: `${computed.progressPct}%` }}
            >
              {computed.progressPct > 15 && "Raised"}
            </div>
            <div
              className="bg-slate-500/10 flex items-center justify-center text-xs font-medium text-muted-foreground"
              style={{ width: `${100 - computed.progressPct}%` }}
            >
              {100 - computed.progressPct > 15 && "Remaining"}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Raised: {formatCompactCurrency(info.raisedSol)} (
              {computed.progressPct.toFixed(1)}%)
            </span>
            <span>
              Remaining: {formatCompactCurrency(computed.capRemainingSol)} (
              {(100 - computed.progressPct).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 4-item Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Funding Ends</div>
            <div className="font-semibold">
              {formatDate(info.fundingEndAt)}
              <span className="text-xs text-muted-foreground ml-1">
                ({pluralize(computed.daysToFundingEnd, "day")} left)
              </span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Min Investment</div>
            <div className="font-semibold">
              {formatCompactCurrency(info.minInvestmentSol)} SOL
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Maturity Date</div>
            <div className="font-semibold">{formatDate(info.maturityAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Total Cap</div>
            <div className="font-semibold">
              {formatCompactCurrency(info.capSol)} SOL
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Funds are deployed after the funding phase. Investors receive
          principal and expected yield upon maturity.
        </div>
      </div>
    </Card>
  );
}
