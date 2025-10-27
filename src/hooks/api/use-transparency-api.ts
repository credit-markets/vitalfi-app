/**
 * React Query hook for fetching transparency data from backend API
 * Follows the same pattern as use-vaults-api.ts, use-positions-api.ts, etc.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/backend";
import type { Receivable, HedgePosition, VaultDocument } from "@/types/vault";

// ============================================================================
// Backend DTOs
// ============================================================================

export interface CollateralAnalyticsDTO {
  receivableCount: number;
  faceValueTotal: number;
  costBasisTotal: number;
  outstandingTotal: number;
  weightedAvgLifeDays: number;
  topOriginatorPct?: number;
  topPayerPct?: number;
}

export interface TransparencyDTO {
  collateral: {
    analytics: CollateralAnalyticsDTO;
    items: Receivable[];
  };
  hedge?: HedgePosition;
  documents: {
    files: VaultDocument[];
  };
  lastUpdated?: string;
}

// ============================================================================
// React Query Hook
// ============================================================================

interface UseTransparencyAPIParams {
  vaultPda: string;
  enabled?: boolean;
}

/**
 * Fetch transparency data for a specific vault
 * GET /api/transparency/:vaultPda
 */
export function useTransparencyAPI({ vaultPda, enabled = true }: UseTransparencyAPIParams) {
  return useQuery({
    queryKey: ["transparency-api", vaultPda],
    queryFn: async ({ signal }) => {
      if (!vaultPda || typeof vaultPda !== "string" || vaultPda.trim() === "") {
        throw new Error("Invalid vault PDA provided");
      }

      return apiFetch<TransparencyDTO>(`/api/transparency/${vaultPda}`, {
        signal,
        cacheKey: `/api/transparency/${vaultPda}`,
      });
    },
    enabled: enabled && !!vaultPda,
    staleTime: 30_000, // 30 seconds (same as other API hooks)
    gcTime: 5 * 60_000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      // Retry up to 3 times on 5xx errors
      return failureCount < 3;
    },
  });
}
