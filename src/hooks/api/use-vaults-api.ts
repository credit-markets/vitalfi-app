"use client";

import { useQuery } from "@tanstack/react-query";
import { listVaults, VaultStatus } from "@/lib/api/backend";
import { hasStatusCode } from "@/lib/api/type-guards";
import { useMemo } from "react";

export interface UseVaultsAPIParams {
  authority: string;
  status?: VaultStatus;
  cursor?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch vaults from backend API
 *
 * RESILIENCY FEATURES:
 * - Stable query keys (useMemo for params object)
 * - Abort signal automatically provided by React Query
 * - Retry on 5xx, no retry on 4xx
 * - ETag/304 caching via backend client
 */
export function useVaultsAPI(params: UseVaultsAPIParams) {
  // RESILIENCY PATCH: Stable query keys
  // Use stable object reference to prevent unnecessary refetches
  const stableParams = useMemo(
    () => ({
      authority: params.authority,
      status: params.status,
      cursor: params.cursor,
      limit: params.limit,
    }),
    [params.authority, params.status, params.cursor, params.limit]
  );

  return useQuery({
    queryKey: ["vaults-api", stableParams],
    queryFn: async ({ signal }) =>
      listVaults(
        {
          authority: params.authority,
          status: params.status,
          cursor: params.cursor,
          limit: params.limit,
        },
        { signal }
      ),
    enabled: params.enabled !== false && !!params.authority,
    staleTime: 30_000, // Match backend s-maxage
    refetchOnWindowFocus: false,
    retry: (failureCount, error: unknown) => {
      // Retry on 5xx errors, don't retry on 4xx
      if (hasStatusCode(error) && error.statusCode >= 500) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
