"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PositionCard } from "@/components/portfolio/PositionCard";
import { ActivityTable } from "@/components/portfolio/ActivityTable";
import { Timeline } from "@/components/portfolio/Timeline";
import { usePortfolioAPI } from "@/hooks/vault/use-portfolio-api";
import { useSidebar } from "@/providers/SidebarContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Wallet as WalletIcon } from "lucide-react";
import type { PortfolioPosition } from "@/hooks/vault/use-portfolio-api";
import { useClaim } from "@/hooks/mutations";
import { env } from "@/lib/env";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import type { VaultStatus } from "@/types/vault";

type StageFilter = VaultStatus[];

export default function PortfolioPage() {
  const { isCollapsed } = useSidebar();
  const { summary, positions, activity, connected, vaults } = usePortfolioAPI();

  const [stageFilter, setStageFilter] = useState<StageFilter>(["Matured"]);
  const [highlightedVault, setHighlightedVault] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const claim = useClaim();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClaim = async (vaultId: string) => {
    // Prevent race conditions from double-clicks
    if (claim.isPending) return;

    try {
      // Find vault to get assetMint
      const vault = vaults.find(v => v.vaultId === vaultId);
      if (!vault) {
        throw new Error(`Vault ${vaultId} not found`);
      }

      if (!vault.assetMint) {
        throw new Error(`Vault ${vaultId} has no asset mint`);
      }

      // Get authority and prepare transaction params
      const authority = new PublicKey(env.vaultAuthority);
      const vaultIdBN = new BN(vaultId);
      const assetMint = new PublicKey(vault.assetMint);

      // Execute claim transaction
      await claim.mutateAsync({
        vaultId: vaultIdBN,
        authority,
        assetMint,
      });

      // Success - toast notification is automatic
    } catch (error) {
      // Error toast is automatic
      console.error("Claim failed:", error);
    }
  };

  const scrollToVault = (vaultId: string) => {
    const cardElement = cardRefs.current[vaultId];
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight effect using React state
      setHighlightedVault(vaultId);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setHighlightedVault(null);
        timeoutRef.current = null;
      }, 2000);
    }
  };

  const toggleStage = (stage: VaultStatus) => {
    if (stageFilter.includes(stage)) {
      setStageFilter(stageFilter.filter(s => s !== stage));
    } else {
      setStageFilter([...stageFilter, stage]);
    }
  };

  const filteredPositions: PortfolioPosition[] =
    stageFilter.length === 0
      ? positions
      : positions.filter((p) => stageFilter.includes(p.status));

  if (!connected) {
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
            <Card className="p-8 sm:p-12 bg-card border-border text-center">
              <WalletIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Please connect your wallet to view your portfolio
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          {/* Page Title */}
          <h1 className="text-3xl sm:text-4xl font-bold">My Portfolio</h1>

          {/* Summary KPIs */}
          <PortfolioHeader summary={summary} positions={positions} />

          {/* Timeline */}
          <Timeline positions={positions} onEventClick={scrollToVault} />

          {/* Filter Pills (multi-select) */}
          {positions.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">Filter by stage:</span>
              {(["Matured", "Funding", "Active", "Canceled"] as VaultStatus[]).map((stage) => {
                const isSelected = stageFilter.includes(stage);
                return (
                  <button
                    key={stage}
                    onClick={() => toggleStage(stage)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all touch-manipulation ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          )}

          {/* Positions Grid */}
          {filteredPositions.length === 0 ? (
            <Card className="p-8 sm:p-12 bg-card border-border text-center">
              <div className="text-muted-foreground mb-4">
                {stageFilter.length === 0
                  ? "No positions found. Start investing to see your portfolio here."
                  : `No positions matching the selected filters.`}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredPositions.map((position) => (
                <div
                  key={position.vaultId}
                  ref={(el) => {
                    cardRefs.current[position.vaultId] = el;
                  }}
                  className={cn(
                    "transition-all duration-300 rounded-lg",
                    highlightedVault === position.vaultId && "ring-2 ring-primary/50"
                  )}
                >
                  <PositionCard
                    position={position}
                    onClaim={handleClaim}
                    claimPending={claim.isPending}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Activity Table */}
          <ActivityTable activity={activity} />
        </div>
      </main>
    </div>
  );
}
