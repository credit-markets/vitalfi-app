"use client";

import { Header } from "@/components/layout/Header";
import { VaultHeader } from "@/components/vault/VaultHeader";
import { VaultAnalytics } from "@/components/vault/VaultAnalytics";
import { ActionCard } from "@/components/vault/ActionCard";
import { ActivityFeed } from "@/components/vault/ActivityFeed";
import { getMockVaultState } from "@/lib/solana/mock-data";

export default function Home() {
  const vaultState = getMockVaultState();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 space-y-12">
          <VaultHeader vaultState={vaultState} />
          <VaultAnalytics vaultState={vaultState} />
          <ActionCard vaultState={vaultState} />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
