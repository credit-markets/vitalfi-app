"use client";

import { useState, useMemo } from "react";
import { VaultCard } from "@/components/transparency/VaultCard";
import { StatsFilterBar } from "./StatsFilterBar";
import type { StatusFilterValue } from "./StageFilter";
import type { VaultSummary } from "@/types/vault";
import { VAULT_STATUSES } from "@/types/vault";

interface VaultsClientWrapperProps {
  vaults: VaultSummary[];
  totalTvl: string;
  activeCount: number;
}

export function VaultsClientWrapper({ vaults, totalTvl, activeCount }: VaultsClientWrapperProps) {
  const [status, setStatus] = useState<StatusFilterValue>('all');

  // Validate and filter out malformed vaults
  const validVaults = useMemo(() => {
    return vaults.filter(v =>
      v &&
      typeof v.id === 'string' &&
      typeof v.status === 'string' &&
      typeof v.targetApy === 'number' &&
      !isNaN(v.targetApy)
    );
  }, [vaults]);

  // Filter vaults based on selected status
  const filteredVaults = useMemo(() => {
    if (status === 'all') return validVaults;
    return validVaults.filter(v => v.status === status);
  }, [validVaults, status]);

  // Calculate counts for each status using a single pass
  const counts = useMemo(() => {
    const result = { all: 0, Funding: 0, Active: 0, Matured: 0, Canceled: 0, Closed: 0 };
    validVaults.forEach(v => {
      result.all++;
      // Count all valid vault statuses
      if (VAULT_STATUSES.includes(v.status as typeof VAULT_STATUSES[number])) {
        result[v.status as keyof typeof result]++;
      }
    });
    return result;
  }, [validVaults]);

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
        status={status}
        onStatusChange={setStatus}
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
              No vaults with this status.
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
