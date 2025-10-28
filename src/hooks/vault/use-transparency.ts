/**
 * Transparency hook for vault collateral, hedge, and documents
 * Follows the same pattern as use-portfolio-api.ts
 */

"use client";

import { useMemo } from "react";
import { useTransparencyAPI } from "@/hooks/api";
import type { VaultTransparencyData, VaultSummary } from "@/types/vault";
import { generateMockTransparencyData } from "@/lib/transparency/utils";

interface UseTransparencyParams {
  vaultPda: string;
  vaultSummary: VaultSummary | null;
  enabled?: boolean;
}

interface UseTransparencyReturn {
  data: VaultTransparencyData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Transparency hook with fallback to mock data
 *
 * Fetches transparency data from backend. If backend returns 404,
 * generates realistic mock data based on vault status.
 */
export function useTransparency({
  vaultPda,
  vaultSummary,
  enabled = true,
}: UseTransparencyParams): UseTransparencyReturn {
  // Fetch from backend API
  const {
    data: apiData,
    isLoading,
    error: apiError,
  } = useTransparencyAPI({
    vaultPda,
    enabled: enabled && !!vaultSummary,
  });

  // Determine if we should use mock data (404 or fetch error)
  const useMockData = useMemo(() => {
    if (!apiError) return false;

    // Use mock data on 404 or network errors
    const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
    return errorMessage.includes("404") || errorMessage.includes("Failed to fetch");
  }, [apiError]);

  // Transform data - memoize mock data generation
  const mockDataCache = useMemo(() => {
    if (!useMockData || !vaultSummary) return null;

    console.warn(`Transparency endpoint not available for ${vaultPda}, using mock data`);

    return generateMockTransparencyData(
      vaultSummary.status,
      vaultSummary.raised,
      vaultSummary.maturityDate
    );
  }, [useMockData, vaultSummary, vaultPda]);

  const data = useMemo<VaultTransparencyData | null>(() => {
    if (!vaultSummary) return null;

    // Use backend data if available
    if (apiData && !useMockData) {
      return {
        summary: vaultSummary,
        collateral: apiData.collateral,
        hedge: apiData.hedge,
        documents: apiData.documents,
        lastUpdated: apiData.lastUpdated || new Date().toISOString(),
      };
    }

    // Fallback to mock data if backend not available
    if (useMockData && mockDataCache) {
      return {
        summary: vaultSummary,
        ...mockDataCache,
        lastUpdated: new Date().toISOString(),
      };
    }

    return null;
  }, [apiData, vaultSummary, useMockData, mockDataCache]);

  // Error handling
  const error = useMemo(() => {
    if (!apiError || useMockData) return null;

    return apiError instanceof Error
      ? apiError.message
      : "Failed to load transparency data";
  }, [apiError, useMockData]);

  return {
    data,
    isLoading,
    error,
  };
}
