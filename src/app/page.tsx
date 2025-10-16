"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultsClientWrapper } from "@/components/vault/VaultsClientWrapper";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { listTransparencyVaults } from "@/lib/transparency/api";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { VaultSummary } from "@/types/vault";

export default function Home() {
  const { isCollapsed } = useSidebar();
  const [vaults, setVaults] = useState<VaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listTransparencyVaults();
      setVaults(data);
    } catch (err) {
      console.error("Failed to load transparency vaults:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load transparency data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  // Calculate summary stats
  const { totalTvl, activeCount } = useMemo(() => {
    const totalTvl = vaults.reduce((sum, v) => sum + (v.raised || 0), 0);
    const activeCount = vaults.filter(
      (v) => v.stage === "Funding" || v.stage === "Funded"
    ).length;
    return { totalTvl, activeCount };
  }, [vaults]);

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
          {loading ? (
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
              <p className="text-red-400 text-lg mb-2">
                Failed to load transparency data
              </p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={loadVaults}>Retry</Button>
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No transparency data available yet
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2">
                Transparency reports are published for funded and matured vaults
              </p>
            </div>
          ) : (
            <VaultsClientWrapper
              vaults={vaults}
              totalTvl={formatCurrency(totalTvl, "SOL")}
              activeCount={activeCount}
            />
          )}
        </div>
      </main>
    </div>
  );
}
