"use client";

import { useMemo, useState } from "react";
import { PositionCard, type PositionCardProps } from "./PositionCard";
import type { PortfolioPosition } from "@/hooks/vault/use-portfolio-api";
import { getPositionStage } from "@/lib/portfolio/position-stage";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface PositionsGridProps {
  positions: PortfolioPosition[];
  onClaim?: PositionCardProps['onClaim'];
  onRefund?: PositionCardProps['onRefund'];
  onViewVault?: PositionCardProps['onViewVault'];
  filter?: 'all' | 'funding' | 'matured' | 'canceled';
  claimPending?: boolean;
}

type FilterOption = 'all' | 'funding' | 'matured' | 'canceled';

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  funding: 'Funding',
  matured: 'Matured',
  canceled: 'Canceled',
};

/**
 * Grid layout for position cards with filtering by stage
 */
export function PositionsGrid({
  positions,
  onClaim,
  onRefund,
  onViewVault,
  filter: initialFilter = 'all',
  claimPending,
}: PositionsGridProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(initialFilter);

  // Calculate counts for each filter
  const counts = useMemo(() => {
    const stageCounts = {
      all: positions.length,
      funding: 0,
      matured: 0,
      canceled: 0,
    };

    positions.forEach((position) => {
      const hasClaimed = (position.status === 'Matured' || position.status === 'Canceled') && !position.canClaim;
      const stage = getPositionStage(position.status, hasClaimed);

      if (stage === 'funding') {
        stageCounts.funding++;
      } else if (stage === 'matured-claimable' || stage === 'matured-claimed') {
        stageCounts.matured++;
      } else if (stage === 'canceled-refundable' || stage === 'canceled-refunded') {
        stageCounts.canceled++;
      }
    });

    return stageCounts;
  }, [positions]);

  // Filter positions based on selected filter
  const filteredPositions = useMemo(() => {
    if (selectedFilter === 'all') {
      return positions;
    }

    return positions.filter((position) => {
      const hasClaimed = (position.status === 'Matured' || position.status === 'Canceled') && !position.canClaim;
      const stage = getPositionStage(position.status, hasClaimed);

      if (selectedFilter === 'funding') {
        return stage === 'funding';
      } else if (selectedFilter === 'matured') {
        return stage === 'matured-claimable' || stage === 'matured-claimed';
      } else if (selectedFilter === 'canceled') {
        return stage === 'canceled-refundable' || stage === 'canceled-refunded';
      }
      return false;
    });
  }, [positions, selectedFilter]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['all', 'funding', 'matured', 'canceled'] as FilterOption[]).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setSelectedFilter(filterOption)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedFilter === filterOption
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {FILTER_LABELS[filterOption]} ({counts[filterOption]})
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredPositions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.vaultId}
              position={position}
              onClaim={onClaim}
              onRefund={onRefund}
              onViewVault={onViewVault}
              claimPending={claimPending}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-2xl border-2 border-dashed border-border/50 p-12 text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
            <p className="text-sm text-muted-foreground">
              {selectedFilter === 'all'
                ? 'Your positions will appear here once you deposit into a vault.'
                : `No ${FILTER_LABELS[selectedFilter].toLowerCase()} positions found.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
