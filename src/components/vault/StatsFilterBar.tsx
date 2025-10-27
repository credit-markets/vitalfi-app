"use client";

import { StatusFilter, type StatusFilterValue } from "./StageFilter";

interface StatsFilterBarProps {
  totalTvl: string;
  activeCount: number;
  status: StatusFilterValue;
  onStatusChange: (value: StatusFilterValue) => void;
  counts?: {
    all: number;
    Funding: number;
    Active: number;
    Matured: number;
    Canceled: number;
    Closed: number;
  };
}

export function StatsFilterBar({
  totalTvl,
  activeCount,
  status,
  onStatusChange,
  counts
}: StatsFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Stats Section */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground/70 uppercase tracking-wide text-[10px] sm:text-xs font-medium whitespace-nowrap">
            Total TVL
          </span>
          <span className="text-foreground font-bold text-sm sm:text-base whitespace-nowrap">
            {totalTvl}
          </span>
        </div>
        <div className="h-8 w-px bg-border/60" />
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground/70 uppercase tracking-wide text-[10px] sm:text-xs font-medium whitespace-nowrap">
            Active Vaults
          </span>
          <span className="text-foreground font-bold text-sm sm:text-base whitespace-nowrap">
            {activeCount}
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <StatusFilter value={status} onValueChange={onStatusChange} counts={counts} />
    </div>
  );
}
