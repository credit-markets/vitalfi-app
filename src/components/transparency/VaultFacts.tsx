"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { Clock, ExternalLink } from "lucide-react";
import type { VaultSummary } from "@/types/vault";

interface VaultFactsProps {
  summary: VaultSummary;
  lastUpdated?: string;
}

export function VaultFacts({ summary, lastUpdated }: VaultFactsProps) {
  const maturityDate = new Date(summary.maturityDate);
  const isValidDate = !isNaN(maturityDate.getTime());
  const daysToMaturity = isValidDate
    ? Math.floor((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const isMatured = daysToMaturity < 0;

  // Format last updated time ago
  const getTimeAgo = (isoDate: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="p-4 sm:p-5 bg-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {summary.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={summary.status === 'Active' ? 'default' : 'secondary'}
              className={
                summary.status === 'Active'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
              }
            >
              {summary.status}
            </Badge>
            {lastUpdated && (
              <Tooltip content={<p className="text-xs">Last data refresh</p>}>
                <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(lastUpdated)}</span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Compact Facts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Tooltip content={<p className="text-sm">Total amount raised out of target cap</p>}>
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Raised / Cap</div>
            <div className="text-sm font-semibold text-foreground">
              {formatCompactCurrency(summary.raised)} / {formatCompactCurrency(summary.cap)}
            </div>
          </div>
        </Tooltip>

        <Tooltip content={<p className="text-sm">Fixed annual yield at maturity</p>}>
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Target APY</div>
            <div className="text-sm font-semibold text-foreground">
              {(summary.targetApy * 100).toFixed(1)}% p.y.
            </div>
          </div>
        </Tooltip>

        <Tooltip
          content={
            <p className="text-sm">
              {isMatured ? 'Vault matured on this date' : 'Expected principal + yield distribution date'}
            </p>
          }
        >
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Maturity Date</div>
            <div className="text-sm font-semibold text-foreground">
              {isValidDate ? (
                maturityDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              ) : (
                <span className="text-red-400">Invalid date</span>
              )}
            </div>
            {isValidDate && !isMatured && daysToMaturity >= 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                in {daysToMaturity} days
              </div>
            )}
          </div>
        </Tooltip>

        <Tooltip
          content={
            <div className="text-sm">
              <p className="font-medium mb-1">{summary.originator.name}</p>
              {summary.originator.note && <p className="text-muted-foreground">{summary.originator.note}</p>}
            </div>
          }
        >
          <div>
            <div className="text-xs text-muted-foreground/80 mb-1">Originator</div>
            <div className="text-sm font-semibold text-foreground truncate">
              {summary.originator.name}
            </div>
            {summary.originator.website && (
              <a
                href={summary.originator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
              >
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </Tooltip>
      </div>

      {/* Operation Note */}
      {summary.originator.note && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {summary.originator.note}
          </p>
        </div>
      )}
    </Card>
  );
}
