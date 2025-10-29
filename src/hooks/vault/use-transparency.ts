/**
 * Transparency hook for vault collateral, hedge, and documents
 * Follows the same pattern as use-portfolio-api.ts
 */

"use client";

import { useMemo } from "react";
import { useTransparencyAPI } from "@/hooks/api";
import type { VaultTransparencyData, VaultSummary } from "@/types/vault";
import { generateMockTransparencyData } from "@/lib/transparency/utils";

const STUB_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Term Sheet.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/term-sheet.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-3',
    name: 'Purchase Agreement.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/purchase-agreement.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-4',
    name: 'Servicing Agreement.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/servicing.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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
  const shouldFetchAPI = enabled && !!vaultSummary &&
    (vaultSummary.status === "Active" || vaultSummary.status === "Matured");

  // Fetch from backend API
  const {
    data: apiData,
    isLoading,
    error: apiError,
  } = useTransparencyAPI({
    vaultPda,
    enabled: shouldFetchAPI,
  });

  // Determine if we should use mock data (404 or fetch error)
  const useMockData = useMemo(() => {
    if (!apiError) return false;

    // Use mock data on 404 or network errors
    const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
    return errorMessage.includes("404") || errorMessage.includes("Failed to fetch");
  }, [apiError]);

  const vaultStatus = vaultSummary?.status;
  const vaultRaised = vaultSummary?.raised;
  const vaultMaturityDate = vaultSummary?.maturityDate;

  const shouldGenerateMockData = useMockData && (vaultStatus === "Active" || vaultStatus === "Matured");
  const mockDataCache = useMemo(() => {
    if (!shouldGenerateMockData || !vaultStatus || vaultRaised === undefined || !vaultMaturityDate) return null;

    console.warn(`Transparency endpoint not available for ${vaultPda}, using mock data`);

    return generateMockTransparencyData(vaultStatus, vaultRaised, vaultMaturityDate);
  }, [shouldGenerateMockData, vaultStatus, vaultRaised, vaultMaturityDate, vaultPda]);

  const data = useMemo<VaultTransparencyData | null>(() => {
    if (!vaultSummary) return null;

    if (vaultStatus === "Funding" || vaultStatus === "Canceled" || vaultStatus === "Closed") {
      return {
        summary: vaultSummary,
        collateral: {
          analytics: {
            receivableCount: 0,
            faceValueTotal: 0,
            costBasisTotal: 0,
            outstandingTotal: 0,
            weightedAvgLifeDays: 0,
          },
          items: [],
        },
        hedge: undefined,
        documents: { files: STUB_DOCUMENTS },
        lastUpdated: new Date().toISOString(),
      };
    }

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

    if (useMockData && mockDataCache) {
      return {
        summary: vaultSummary,
        ...mockDataCache,
        lastUpdated: new Date().toISOString(),
      };
    }

    return null;
  }, [apiData, vaultSummary, useMockData, mockDataCache, vaultStatus]);

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
