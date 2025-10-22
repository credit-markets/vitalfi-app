"use client";

import { useQuery } from "@tanstack/react-query";
import { listPositions } from "@/lib/api/backend";
import { calculateRetryDelay } from "@/lib/constants";
import { hasStatusCode } from "@/lib/api/type-guards";
import { useMemo } from "react";

export interface UsePositionsAPIParams {
  owner: string;
  cursor?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch user positions from backend API
 */
export function usePositionsAPI(params: UsePositionsAPIParams) {
  // RESILIENCY PATCH: Stable query keys
  const stableParams = useMemo(
    () => ({
      owner: params.owner,
      cursor: params.cursor,
      limit: params.limit,
    }),
    [params.owner, params.cursor, params.limit]
  );

  return useQuery({
    queryKey: ["positions-api", stableParams],
    queryFn: async ({ signal }) =>
      listPositions(
        {
          owner: params.owner,
          cursor: params.cursor,
          limit: params.limit,
        },
        { signal }
      ),
    enabled: params.enabled !== false && !!params.owner,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: unknown) => {
      if (hasStatusCode(error) && error.statusCode >= 500) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) =>
      calculateRetryDelay(attemptIndex),
  });
}
