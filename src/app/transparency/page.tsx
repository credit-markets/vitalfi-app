"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { HeaderFacts } from "@/components/transparency/HeaderFacts";
import { CollateralOverview } from "@/components/transparency/CollateralOverview";
import { DerivationsCharts } from "@/components/transparency/DerivationsCharts";
import { ParametersPanel } from "@/components/transparency/ParametersPanel";
import { ReconciliationCard } from "@/components/transparency/ReconciliationCard";
import { AccountsCard } from "@/components/transparency/AccountsCard";
import { EventFeed } from "@/components/transparency/EventFeed";
import { Disclosures } from "@/components/transparency/Disclosures";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTransparency } from "@/hooks/useTransparency";
import { cn } from "@/lib/utils";
import type { EventTag } from "@/types/vault";

export default function TransparencyPage() {
  const { isCollapsed } = useSidebar();
  const { stats, snapshot, events, paramChanges, derived, reconciliation, lastUpdated } = useTransparency();
  const eventFeedRef = useRef<HTMLDivElement>(null);
  const [eventFilters, setEventFilters] = useState<EventTag[]>(["Repayment", "Claim"]);

  const handleViewEvents = () => {
    setEventFilters(["Repayment"]);
    eventFeedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <HeaderFacts stats={stats} snapshot={snapshot} lastUpdated={lastUpdated} />

          {/* Mobile-first stacked layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <section className="lg:col-span-7 space-y-4 sm:space-y-6">
              <CollateralOverview snapshot={snapshot} tvl={stats.tvl} />
              <DerivationsCharts derived={derived} onViewEvents={handleViewEvents} />
            </section>

            <aside className="lg:col-span-5 space-y-4 sm:space-y-6">
              <ParametersPanel stats={stats} paramChanges={paramChanges} />
              <ReconciliationCard reconciliation={reconciliation} />
              <AccountsCard addresses={stats.addresses} />
            </aside>
          </div>

          <div ref={eventFeedRef}>
            <EventFeed events={events} defaultFilters={eventFilters} />
          </div>

          <Disclosures />
        </div>
      </main>
    </div>
  );
}
