"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { Shield, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import type { HedgePosition } from "@/types/vault";

interface HedgeCardProps {
  hedge?: HedgePosition;
}

export function HedgeCard({ hedge }: HedgeCardProps) {
  // Show empty state if no hedge data
  if (!hedge) {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Hedge Position</h3>
        <p className="text-sm text-muted-foreground">
          Hedge information will appear here once available for this vault
        </p>
      </Card>
    );
  }

  const tenorStart = new Date(hedge.tenorStart);
  const tenorEnd = new Date(hedge.tenorEnd);
  const hasMtm = hedge.mtm !== undefined;
  const hasRealizedPnL = hedge.realizedPnL !== undefined;

  return (
    <Card className="p-4 sm:p-5 bg-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Hedge Position</h3>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {hedge.instrument}
        </Badge>
      </div>

      {/* Coverage */}
      <div className="mb-4">
        <Tooltip content={<p className="text-sm">Percentage of FX exposure hedged</p>}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground/80">Coverage</span>
            <span className="text-sm font-semibold text-foreground">
              {(hedge.coveragePct * 100).toFixed(1)}%
            </span>
          </div>
        </Tooltip>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${hedge.coveragePct * 100}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Pair</div>
            <div className="text-sm font-medium text-foreground">{hedge.pair}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Notional</div>
            <div className="text-sm font-medium text-foreground">
              {formatCompactCurrency(hedge.notional)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Tenor</div>
            <div className="text-sm font-medium text-foreground">
              {tenorStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {' → '}
              {tenorEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
          {hedge.referenceRate && (
            <div>
              <div className="text-xs text-muted-foreground/80 mb-1">Reference Rate</div>
              <div className="text-sm font-medium text-foreground">{hedge.referenceRate}</div>
            </div>
          )}
        </div>

        {/* P&L Section */}
        {(hasMtm || hasRealizedPnL) && (
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {hasMtm && (
                <Tooltip content={<p className="text-sm">Mark-to-market unrealized P&L</p>}>
                  <div>
                    <div className="text-xs text-muted-foreground/80 mb-1">MTM</div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${
                      hedge.mtm! >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {hedge.mtm! >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatCompactCurrency(Math.abs(hedge.mtm!))}
                    </div>
                  </div>
                </Tooltip>
              )}
              {hasRealizedPnL && (
                <Tooltip content={<p className="text-sm">Realized profit/loss from closed positions</p>}>
                  <div>
                    <div className="text-xs text-muted-foreground/80 mb-1">Realized P&L</div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${
                      hedge.realizedPnL! >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {hedge.realizedPnL! >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatCompactCurrency(Math.abs(hedge.realizedPnL!))}
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Counterparty Info */}
        {(hedge.counterparty || hedge.venue) && (
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {hedge.counterparty && (
                <div>
                  <div className="text-xs text-muted-foreground/80 mb-1">Counterparty</div>
                  <div className="text-sm font-medium text-foreground">{hedge.counterparty}</div>
                </div>
              )}
              {hedge.venue && (
                <div>
                  <div className="text-xs text-muted-foreground/80 mb-1">Venue</div>
                  <div className="text-sm font-medium text-foreground">{hedge.venue}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Basis Risk Note */}
        {hedge.basisNote && (
          <Tooltip content={<p className="text-sm max-w-xs">{hedge.basisNote}</p>}>
            <div className="pt-3 border-t border-border">
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{hedge.basisNote}</p>
              </div>
            </div>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}
