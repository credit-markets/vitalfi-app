"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultCard } from "@/components/transparency/VaultCard";
import { useSidebar } from "@/contexts/SidebarContext";
import { listTransparencyVaults } from "@/lib/transparency/api";
import { cn } from "@/lib/utils";
import type { VaultSummary } from "@/types/vault";

export default function Home() {
  const { isCollapsed } = useSidebar();
  const [vaults, setVaults] = useState<VaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVaults() {
      try {
        setLoading(true);
        setError(null);
        const data = await listTransparencyVaults();
        setVaults(data);
      } catch (err) {
        console.error("Failed to load transparency vaults:", err);
        setError(err instanceof Error ? err.message : "Failed to load transparency data");
      } finally {
        setLoading(false);
      }
    }
    loadVaults();
  }, []);

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
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Vaults
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Explore available vaults and their transparency reports
            </p>
          </div>

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
              <p className="text-red-400 text-lg mb-2">Failed to load transparency data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {vaults.map((vault) => (
                <VaultCard key={vault.id} vault={vault} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
