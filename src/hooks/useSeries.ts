"use client";

import { getMockVaultStats } from "@/lib/solana/mock-data";

export interface SeriesData {
  timestamp: string;
  value: number;
}

export interface VaultSeries {
  pps30d: SeriesData[];
  tvl30d: SeriesData[];
  inflows30d: SeriesData[];
}

/**
 * Hook to fetch time series data for vault visualizations
 * Returns PPS, TVL, and inflow data for the last 30 days
 */
export function useSeries(): VaultSeries {
  const stats = getMockVaultStats();

  // Extract PPS and TVL from shareHistory
  const pps30d: SeriesData[] = stats.shareHistory.map((h) => ({
    timestamp: h.t,
    value: h.shareValue,
  }));

  const tvl30d: SeriesData[] = stats.shareHistory.map((h) => ({
    timestamp: h.t,
    value: h.tvl,
  }));

  // Mock inflows data (would come from deposits in production)
  const inflows30d: SeriesData[] = stats.shareHistory.map((h, i) => ({
    timestamp: h.t,
    value: i % 3 === 0 ? 50000 + Math.random() * 30000 : 0, // Simulate periodic deposits
  }));

  return {
    pps30d,
    tvl30d,
    inflows30d,
  };
}
