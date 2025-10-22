"use client";

import {
  useQuery,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getActivity,
  ActivityType,
} from "@/lib/api/backend";
import { hasStatusCode } from "@/lib/api/type-guards";
import { calculateRetryDelay } from "@/lib/constants";
import { useMemo } from "react";

export interface UseActivityAPIParams {
  vault?: string;
  owner?: string;
  cursor?: number;
  limit?: number;
  type?: ActivityType;
  enabled?: boolean;
}

/**
 * Hook to fetch activity feed (paginated)
 */
export function useActivityAPI(params: UseActivityAPIParams) {
  // RESILIENCY PATCH: Stable query keys
  const stableParams = useMemo(
    () => ({
      vault: params.vault,
      owner: params.owner,
      cursor: params.cursor,
      limit: params.limit,
      type: params.type,
    }),
    [params.vault, params.owner, params.cursor, params.limit, params.type]
  );

  return useQuery({
    queryKey: ["activity-api", stableParams],
    queryFn: async ({ signal }) =>
      getActivity(
        {
          vault: params.vault,
          owner: params.owner,
          cursor: params.cursor,
          limit: params.limit,
          type: params.type,
        },
        { signal }
      ),
    enabled: params.enabled !== false && (!!params.vault || !!params.owner),
    staleTime: 15_000, // Activity updates more frequently
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

/**
 * Hook for infinite scroll activity feed
 */
export function useInfiniteActivity(params: {
  vault?: string;
  owner?: string;
  limit?: number;
  type?: ActivityType;
}) {
  // RESILIENCY PATCH: Stable query keys
  const stableParams = useMemo(
    () => ({
      vault: params.vault,
      owner: params.owner,
      limit: params.limit,
      type: params.type,
    }),
    [params.vault, params.owner, params.limit, params.type]
  );

  return useInfiniteQuery({
    queryKey: ["activity-infinite", stableParams],
    queryFn: async ({ pageParam, signal }) =>
      getActivity(
        {
          vault: params.vault,
          owner: params.owner,
          cursor: pageParam,
          limit: params.limit || 50,
          type: params.type,
        },
        { signal }
      ),
    getNextPageParam: (lastPage) => {
      // RESILIENCY PATCH: Proper undefined handling
      // Return undefined (not null) when no more pages
      return lastPage.nextCursor ?? undefined;
    },
    enabled: !!params.vault || !!params.owner,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    initialPageParam: undefined as number | undefined,
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
