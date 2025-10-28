"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import { FileText, PieChart, TrendingUp, Calendar } from "lucide-react";
import { ReceivablesTable } from "./ReceivablesTable";
import type { CollateralAnalytics, Receivable } from "@/types/vault";

interface CollateralSectionProps {
  analytics: CollateralAnalytics;
  receivables: Receivable[];
  onExportCsv: (filtered: Receivable[]) => void;
}

export function CollateralSection({ analytics, receivables, onExportCsv }: CollateralSectionProps) {
  // If no receivables, show a simple message
  if (receivables.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">No Collateral Yet</h3>
        <p className="text-sm text-muted-foreground">
          Receivables will appear here once the vault transitions to Active status
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analytics Summary Strip */}
      <Card className="p-4 sm:p-5 bg-card border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Collateral Overview</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Count */}
          <Tooltip content="Total number of receivables in pool">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
                <FileText className="w-3 h-3" />
                <span>Count</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {analytics.receivableCount}
              </div>
            </div>
          </Tooltip>

          {/* Face Value */}
          <Tooltip content="Total notional value of all receivables">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Face Value</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatCompactCurrency(analytics.faceValueTotal)}
              </div>
            </div>
          </Tooltip>

          {/* Cost Basis */}
          <Tooltip content="Total purchase price paid for receivables">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
                <span>Cost Basis</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatCompactCurrency(analytics.costBasisTotal)}
              </div>
            </div>
          </Tooltip>

          {/* Outstanding */}
          <Tooltip content="Total expected repayments (performing + matured)">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
                <span>Outstanding</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatCompactCurrency(analytics.outstandingTotal)}
              </div>
            </div>
          </Tooltip>

          {/* WAL */}
          <Tooltip content="Weighted average life of receivables portfolio">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-1">
                <Calendar className="w-3 h-3" />
                <span>WAL</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {analytics.weightedAvgLifeDays} days
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Concentration Pills */}
        {(analytics.topOriginatorPct || analytics.topPayerPct) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground flex-shrink-0">Concentration:</span>
            <div className="flex flex-wrap items-center gap-2">
              {analytics.topOriginatorPct && (
                <Tooltip content="Largest originator as % of total face value">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <PieChart className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-primary whitespace-nowrap">
                      Top Originator: {(analytics.topOriginatorPct * 100).toFixed(1)}%
                    </span>
                  </div>
                </Tooltip>
              )}
              {analytics.topPayerPct && (
                <Tooltip content="Largest payer as % of total face value">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                    <PieChart className="w-3 h-3 text-secondary flex-shrink-0" />
                    <span className="text-xs font-medium text-secondary whitespace-nowrap">
                      Top Payer: {(analytics.topPayerPct * 100).toFixed(1)}%
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Receivables Table */}
      <ReceivablesTable receivables={receivables} onExportCsv={onExportCsv} />
    </div>
  );
}
