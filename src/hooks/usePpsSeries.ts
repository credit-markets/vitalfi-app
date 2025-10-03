"use client";

import { getMockVaultStats } from "@/lib/solana/mock-data";
import type { PpsPoint } from "@/types/vault";

/**
 * Hook to fetch PPS time series for sparkline
 * Returns array of {t, pps} points
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePpsSeries(_days: number = 30): PpsPoint[] {
  const stats = getMockVaultStats();

  // Extract PPS from shareHistory
  return stats.shareHistory.map((h) => ({
    t: h.t,
    pps: h.shareValue,
  }));
}
