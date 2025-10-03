"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Accent3D } from "@/components/vault/Accent3D";
import { KpiStrip } from "@/components/vault/KpiStrip";
import { Visuals } from "@/components/vault/Visuals";
import { SlimChart } from "@/components/vault/SlimChart";
import { TransactionsTable } from "@/components/vault/TransactionsTable";
import { ActionPanel } from "@/components/vault/ActionPanel";
import { VaultInfoCard } from "@/components/vault/VaultInfoCard";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { SHOW_3D_ACCENT, SHOW_SLIM_CHART, ACCENT_3D_MODE } from "@/lib/constants";

export default function Home() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main
        className={cn(
          "pt-32 pb-16 transition-all duration-300",
          "lg:ml-16", // Default collapsed state
          !isCollapsed && "lg:ml-64" // Expanded state
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* 3D Accent (optional) */}
          {SHOW_3D_ACCENT && <Accent3D size={ACCENT_3D_MODE} />}

          {/* KPI Strip */}
          <KpiStrip />

          {/* Two-column layout: 60% left, 40% right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: Visuals + Transactions */}
            <section className="lg:col-span-7 space-y-6">
              {SHOW_SLIM_CHART ? <SlimChart /> : <Visuals />}
              <TransactionsTable />
            </section>

            {/* Right column: Action Panel + Vault Info */}
            <aside className="lg:col-span-5 space-y-6">
              <ActionPanel />
              <VaultInfoCard />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
