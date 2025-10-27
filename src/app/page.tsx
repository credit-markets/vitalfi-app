"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultsClientWrapper } from "@/components/vault/VaultsClientWrapper";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/providers/SidebarContext";
import { useVaultsAPI } from "@/hooks/api";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { fromBaseUnits, parseTimestamp } from "@/lib/api/formatters";
import { getTokenDecimals, getTokenSymbol } from "@/lib/sdk/config";
import type { VaultSummary } from "@/types/vault";
import { SOL_DECIMALS, DEFAULT_ORIGINATOR } from "@/lib/utils/constants";
import { env } from "@/lib/env";

// Get authority from centralized environment configuration
const AUTHORITY = env.vaultAuthority;

export default function Home() {
  const { isCollapsed } = useSidebar();

  // Fetch vaults from backend API
  const {
    data: vaultsResponse,
    isLoading,
    error: fetchError,
    refetch,
  } = useVaultsAPI({
    authority: AUTHORITY,
    limit: 100,
    enabled: !!AUTHORITY,
  });

  // Transform API DTOs to VaultSummary format
  const vaults = useMemo<VaultSummary[]>(() => {
    if (!vaultsResponse) return [];

    return vaultsResponse.items.map((vault) => {
      const decimals = vault.assetMint
        ? getTokenDecimals(vault.assetMint)
        : SOL_DECIMALS;
      const raised = fromBaseUnits(vault.totalDeposited, decimals);
      const cap = fromBaseUnits(vault.cap, decimals);

      return {
        id: vault.vaultId,
        title: vault.vaultId,
        status: vault.status,
        raised,
        cap,
        targetApy: vault.targetApyBps ? vault.targetApyBps / 10000 : 0,
        maturityDate: parseTimestamp(vault.maturityTs)?.toISOString() || "",
        originator: DEFAULT_ORIGINATOR,
        assetMint: vault.assetMint || undefined,
      };
    });
  }, [vaultsResponse]);

  // Calculate summary stats
  const { totalTvl, activeCount, tokenSymbol } = useMemo(() => {
    const totalTvl = vaults.reduce((sum, v) => sum + (v.raised || 0), 0);
    const activeCount = vaults.filter(
      (v) => v.status === "Funding" || v.status === "Active"
    ).length;
    // Get token symbol from first vault (assuming all vaults use same token)
    const firstVaultMint = vaults[0]?.assetMint;
    const tokenSymbol = firstVaultMint ? getTokenSymbol(firstVaultMint) : 'USDT';
    return { totalTvl, activeCount, tokenSymbol };
  }, [vaults]);

  const error =
    fetchError instanceof Error
      ? fetchError.message
      : fetchError
      ? "Failed to load vaults"
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main
        className={cn(
          "pt-24 pb-20 lg:pb-16 transition-all duration-300",
          "lg:ml-16",
          !isCollapsed && "lg:ml-64"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <header className="space-y-2 mb-6 pb-6 border-b border-border/50">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Vaults
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Each vault represents a tokenized pool of healthcare receivables,
              providing on-chain access to short-term, yield-bearing assets.
            </p>
          </header>

          {/* Vault Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-card border border-border rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Failed to load vaults</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No vaults available yet
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2">
                Check back soon for new investment opportunities
              </p>
            </div>
          ) : (
            <VaultsClientWrapper
              vaults={vaults}
              totalTvl={`${formatCompactNumber(totalTvl)} ${tokenSymbol}`}
              activeCount={activeCount}
            />
          )}
        </div>
      </main>
    </div>
  );
}
