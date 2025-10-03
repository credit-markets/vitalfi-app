"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Accent3D } from "@/components/vault/Accent3D";
import { ValueCard } from "@/components/portfolio/ValueCard";
import { EarningsCard } from "@/components/portfolio/EarningsCard";
import { PendingWithdrawals } from "@/components/portfolio/PendingWithdrawals";
import { ActivityTable } from "@/components/portfolio/ActivityTable";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { usePpsSeries } from "@/hooks/usePpsSeries";
import { usePortfolioEvents } from "@/hooks/usePortfolioEvents";
import { useUserQueue } from "@/hooks/useUserQueue";
import { useClaimWithdrawal } from "@/hooks/useClaimWithdrawal";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Wallet as WalletIcon } from "lucide-react";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { isCollapsed } = useSidebar();

  const summary = usePortfolioSummary();
  const ppsSeries = usePpsSeries(30);
  const { events } = usePortfolioEvents();
  const queue = useUserQueue();
  const { claim } = useClaimWithdrawal();

  // Convert queue to pending withdrawals array
  const pendingWithdrawals = queue.pending
    ? [{
        id: "pending-1",
        amount: queue.pending.amountShares,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        claimAt: queue.pending.claimAt,
        estSolOut: queue.pending.estSol,
      }]
    : [];

  if (!connected || !summary) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <main
          className={cn(
            "pt-32 pb-16 transition-all duration-300",
            "lg:ml-16",
            !isCollapsed && "lg:ml-64"
          )}
        >
          <div className="container mx-auto px-4">
            <Card className="p-12 bg-card border-border text-center">
              <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
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
          "pt-32 pb-16 transition-all duration-300",
          "lg:ml-16",
          !isCollapsed && "lg:ml-64"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative">
          {/* Optional 3D Orb */}
          <div className="hidden md:block absolute right-6 -top-6 z-0">
            <Accent3D size="orb" />
          </div>

          {/* Overview Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Holdings & Value */}
            <div className="lg:col-span-8">
              <ValueCard summary={summary} ppsSeries={ppsSeries} />
            </div>

            {/* Right: Earnings + Pending Withdrawals */}
            <aside className="lg:col-span-4 space-y-6">
              <EarningsCard summary={summary} />
              <PendingWithdrawals items={pendingWithdrawals} onClaim={claim} />
            </aside>
          </section>

          {/* Your Activity */}
          <section>
            <ActivityTable events={events} />
          </section>
        </div>
      </main>
    </div>
  );
}
