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

  // Calculate counts for each stage
  const counts = useMemo(() => ({
    all: vaults.length,
    Funding: vaults.filter(v => v.stage === 'Funding').length,
    Funded: vaults.filter(v => v.stage === 'Funded').length,
    Matured: vaults.filter(v => v.stage === 'Matured').length,
  }), [vaults]);

  // Calculate average APY for filtered vaults
  const avgApy = useMemo(() => {
    if (filteredVaults.length === 0) return 0;
    const sum = filteredVaults.reduce((acc, v) => acc + v.targetApy, 0);
    return (sum / filteredVaults.length) * 100;
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
