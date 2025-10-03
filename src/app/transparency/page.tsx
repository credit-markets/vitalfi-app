"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AccountsPanel } from "@/components/transparency/AccountsPanel";
import { ParamsPanel } from "@/components/transparency/ParamsPanel";
import { DerivationCharts } from "@/components/transparency/DerivationCharts";
import { EventInspector } from "@/components/transparency/EventInspector";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTransparency } from "@/hooks/useTransparency";
import { cn } from "@/lib/utils";

export default function TransparencyPage() {
  const { isCollapsed } = useSidebar();
  const { stats, addresses, events, derived, downloadEvents } =
    useTransparency();

  const status = stats.paused ? "Paused" : "Active";
  const statusVariant = stats.paused
    ? ("destructive" as const)
    : ("default" as const);

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Transparency
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  On-chain accounts, parameters, and derivations for Healthy
                  Yield
                </p>
              </div>
              <Badge variant={statusVariant} className="text-sm px-4 py-2">
                Status: {status}
              </Badge>
            </div>
          </div>

          {/* Accounts & Parameters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccountsPanel addresses={addresses} />
            <ParamsPanel stats={stats} addresses={addresses} />
          </div>

          {/* Derivations & Charts */}
          <DerivationCharts
            pricePerShareSeries={derived.pricePerShareSeries}
            apySeries={derived.apySeries}
          />

          {/* Event Inspector */}
          <EventInspector events={events} onDownload={downloadEvents} />
        </div>
      </main>
    </div>
  );
}
