"use client";

import { useState, useMemo } from "react";
import { VaultCard } from "@/components/transparency/VaultCard";
import { StatsFilterBar } from "./StatsFilterBar";
import type { StageFilterValue } from "./StageFilter";
import type { VaultSummary } from "@/types/vault";

interface VaultsClientWrapperProps {
  vaults: VaultSummary[];
  totalTvl: string;
  activeCount: number;
}

export function VaultsClientWrapper({ vaults, totalTvl, activeCount }: VaultsClientWrapperProps) {
  const [stage, setStage] = useState<StageFilterValue>('all');

  // Filter vaults based on selected stage
  const filteredVaults = useMemo(() => {
    if (stage === 'all') return vaults;
    return vaults.filter(v => v.stage === stage);
  }, [vaults, stage]);

  // Calculate counts for each stage using a single pass
  const counts = useMemo(() => {
    const result = { all: 0, Funding: 0, Funded: 0, Matured: 0 };
    vaults.forEach(v => {
      result.all++;
      // Only count stages that are tracked in the filter
      if (v.stage === 'Funding' || v.stage === 'Funded' || v.stage === 'Matured') {
        result[v.stage]++;
      }
    });
    return result;
  }, [vaults]);

  // Calculate average APY for filtered vaults
  // Note: targetApy is stored as decimal (e.g., 0.12 for 12%)
  const avgApy = useMemo(() => {
    if (filteredVaults.length === 0) return 0;
    const sum = filteredVaults.reduce((acc, v) => acc + v.targetApy, 0);
    const DECIMAL_TO_PERCENTAGE = 100;
    return (sum / filteredVaults.length) * DECIMAL_TO_PERCENTAGE;
  }, [filteredVaults]);

  return (
    <>
      {/* Stats + Filter Bar */}
      <StatsFilterBar
        totalTvl={totalTvl}
        activeCount={activeCount}
        stage={stage}
        onStageChange={setStage}
        counts={counts}
      />

      {/* Context Summary */}
      <div className="mb-4 text-xs text-muted-foreground">
        Showing {filteredVaults.length} vault{filteredVaults.length !== 1 ? 's' : ''}
        {filteredVaults.length > 0 && (
          <> · Avg APY <span className="font-semibold">{avgApy.toFixed(1)}% p.y.</span></>
        )}
      </div>

      {/* Vault Grid */}
      {filteredVaults.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto bg-muted/30 rounded-lg border border-border p-8">
            <p className="text-muted-foreground">
              No vaults in this stage.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredVaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </div>
      )}
    </>
  );
}
