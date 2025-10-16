"use client";

import { StageFilter, type StageFilterValue } from "./StageFilter";

interface StatsFilterBarProps {
  totalTvl: string;
  activeCount: number;
  stage: StageFilterValue;
  onStageChange: (value: StageFilterValue) => void;
  counts?: {
    all: number;
    Funding: number;
    Funded: number;
    Matured: number;
  };
}

export function StatsFilterBar({
  totalTvl,
  activeCount,
  stage,
  onStageChange,
  counts
}: StatsFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      {/* Stats Section */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70 uppercase tracking-wide text-xs font-medium">
            Total TVL
          </span>
          <span className="text-foreground font-bold text-base">
            {totalTvl}
          </span>
        </div>
        <div className="h-4 w-px bg-border/60" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70 uppercase tracking-wide text-xs font-medium">
            Active Vaults
          </span>
          <span className="text-foreground font-bold text-base">
            {activeCount}
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <StageFilter value={stage} onValueChange={onStageChange} counts={counts} />
    </div>
  );
}
