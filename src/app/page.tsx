"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Accent3D } from "@/components/vault/Accent3D";
import { KpiStrip } from "@/components/vault/KpiStrip";
import { VaultOverview } from "@/components/vault/VaultOverview";
import { ActivityFeed } from "@/components/vault/ActivityFeed";
import { ActionPanel } from "@/components/vault/ActionPanel";
import { VaultInfoCard } from "@/components/vault/VaultInfoCard";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { SHOW_3D_ACCENT, ACCENT_3D_MODE } from "@/lib/constants";

export default function Home() {
  const { isCollapsed } = useSidebar();

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
          {/* 3D Accent (optional) - Hidden on mobile for performance */}
          {SHOW_3D_ACCENT && <div className="hidden lg:block"><Accent3D size={ACCENT_3D_MODE} /></div>}

          {/* KPI Strip */}
          <KpiStrip />

          {/* Mobile-first stacked layout, desktop two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left column: Vault Overview + Funding Transactions */}
            <section className="lg:col-span-7 space-y-4 sm:space-y-6">
              <VaultOverview />
              <ActivityFeed />
            </section>

            {/* Right column: Action Panel (Participate) + Vault Info */}
            <aside className="lg:col-span-5 space-y-4 sm:space-y-6">
              <ActionPanel />
              <VaultInfoCard />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
