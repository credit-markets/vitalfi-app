"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getMockPortfolioSummary } from "@/lib/solana/mock-data";
import type { PortfolioSummary } from "@/types/vault";

/**
 * Hook to fetch user's portfolio summary
 * Returns holdings, value, earnings breakdown
 */
export function usePortfolioSummary(): PortfolioSummary | null {
  const { publicKey, connected } = useWallet();

  if (!connected || !publicKey) {
    return null;
  }

  // In production, fetch from on-chain data
  return getMockPortfolioSummary(publicKey.toBase58());
}
