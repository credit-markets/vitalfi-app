"use client";

import { getMockVaultStats } from "@/lib/solana/mock-data";
import type { VaultStats } from "@/types/vault";

/**
 * Hook to fetch comprehensive vault statistics
 * Returns TVL, APY, PPS, cap remaining, queue depth, addresses, etc.
 */
export function useVaultStats(): VaultStats {
  // In production, this would fetch from on-chain data
  // For now, return mock data
  return getMockVaultStats();
}
