"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "@/components/vault/KpiStrip";
import { VaultOverview } from "@/components/vault/VaultOverview";
import { ActivityFeed } from "@/components/vault/ActivityFeed";
import { ActionPanel } from "@/components/vault/ActionPanel";
import { VaultInfoCard } from "@/components/vault/VaultInfoCard";
import { useSidebar } from "@/providers/SidebarContext";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function VaultPage() {
  const { isCollapsed } = useSidebar();
  const { error } = useVaultAPI();

  // Show error state if vault not found
  if (error) {
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
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Vault not found</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Link href="/">
                <Button>Back to Vaults</Button>
              </Link>
            </div>
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
          "lg:ml-16", // Default collapsed state
          !isCollapsed && "lg:ml-64" // Expanded state
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vaults
              </Button>
            </Link>
          </div>

          {/* KPI Strip */}
          <KpiStrip />

          {/* Mobile-first stacked layout, desktop two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left column: Vault Overview + Activity Feed */}
            <section className="lg:col-span-7 space-y-4 sm:space-y-6">
              <VaultOverview />

              {/* Activity Feed - hidden on mobile, shown on desktop */}
              <div className="hidden lg:block">
                <ActivityFeed />
              </div>
            </section>

            {/* Right column: Action Panel + Vault Info (desktop) */}
            <aside className="lg:col-span-5 space-y-4 sm:space-y-6">
              <ActionPanel />

              {/* Vault Info - shown on desktop */}
              <div className="hidden lg:block">
                <VaultInfoCard />
              </div>

              {/* Mobile-only sections (shown below ActionPanel) */}
              <div className="lg:hidden space-y-4 sm:space-y-6">
                <VaultInfoCard />
                <ActivityFeed />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
