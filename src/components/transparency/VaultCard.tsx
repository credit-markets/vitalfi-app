"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { getStageColors } from "@/lib/utils/colors";
import { ArrowRight, Calendar, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { VaultSummary } from "@/types/vault";

interface VaultCardProps {
  vault: VaultSummary;
}

export function VaultCard({ vault }: VaultCardProps) {
  const progress = (vault.raised / vault.cap) * 100;
  const maturityDate = new Date(vault.maturityDate);
  const daysToMaturity = Math.floor((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="p-4 sm:p-5 lg:p-6 bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">
            {vault.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {vault.originator.name}
            {vault.originator.country && (
              <span className="ml-1">• {vault.originator.country}</span>
            )}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("flex-shrink-0", getStageColors(vault.stage))}
        >
          {vault.stage}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
            <Target className="w-3 h-3" />
            <span>Raised / Cap</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {formatCompactCurrency(vault.raised)} / {formatCompactCurrency(vault.cap)}
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Target APY</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {(vault.targetApy * 100).toFixed(1)}% p.y.
          </div>
        </div>
      </div>

      {/* Maturity Date */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
          <Calendar className="w-3 h-3" />
          <span>Maturity Date</span>
        </div>
        <div className="text-sm font-medium text-foreground">
          {maturityDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          {vault.stage === 'Funded' && daysToMaturity > 0 && (
            <span className="text-muted-foreground ml-2">
              ({daysToMaturity} days)
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <Link href={`/vault/${vault.id}`}>
          <Button
            variant="outline"
            className="w-full group border-foreground/30 hover:border-primary/50 hover:bg-primary/5"
          >
            View Vault
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
