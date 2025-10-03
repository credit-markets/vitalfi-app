"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultHeader } from "@/components/vault/VaultHeader";
import { VaultAnalytics } from "@/components/vault/VaultAnalytics";
import { ActionCard } from "@/components/vault/ActionCard";
import { ActivityFeed } from "@/components/vault/ActivityFeed";
import { getMockVaultState } from "@/lib/solana/mock-data";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function Home() {
  const vaultState = getMockVaultState();
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-12">
          <VaultHeader vaultState={vaultState} />
          <VaultAnalytics vaultState={vaultState} />
          <ActionCard vaultState={vaultState} />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
