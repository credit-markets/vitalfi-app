"use client";

import { useQuery } from "@tanstack/react-query";
import { getActivity, type ActivityDTO } from "@/lib/api";

export interface UseActivityOptions {
  enabled?: boolean;
  refetchInterval?: number;
  action?: ActivityDTO['type'];
  limit?: number;
  before?: string; // Cursor for pagination
}

/**
 * Hook to fetch activity feed by authority from backend API
 *
 * @param authority - Vault authority public key (base58 string)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: activities } = useAuthorityActivity(authority);
 * ```
 */
export function useAuthorityActivity(
  authority: string | null,
  options: UseActivityOptions = {}
) {
  const { limit = 50, action, before, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["activity", "authority", authority, action, limit, before],
    queryFn: async () => {
      if (!authority) {
        return [];
      }

      const response = await getActivity({
        authority,
        action,
        limit,
        before,
      });

      return response.data;
    },
    enabled: enabled && !!authority,
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch activity feed by owner from backend API
 *
 * @param owner - Position owner public key (base58 string)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: activities } = useUserActivity(publicKey?.toBase58());
 * ```
 */
export function useUserActivity(
  owner: string | null,
  options: UseActivityOptions = {}
) {
  const { limit = 50, action, before, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["activity", "owner", owner, action, limit, before],
    queryFn: async () => {
      if (!owner) {
        return [];
      }

      const response = await getActivity({
        owner,
        action,
        limit,
        before,
      });

      return response.data;
    },
    enabled: enabled && !!owner,
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch all activity (requires either authority or owner)
 *
 * This hook uses the authority parameter if provided, otherwise uses owner.
 * Enable/disable logic is handled internally, so hooks are called unconditionally.
 */
export function useActivity(
  params: {
    authority?: string | null;
    owner?: string | null;
  },
  options: UseActivityOptions = {}
) {
  const { authority, owner } = params;
  const { limit = 50, action, before, enabled = true, refetchInterval } = options;

  // Determine which type of query to make
  const queryType = authority ? 'authority' : owner ? 'owner' : 'none';
  const queryParam = authority || owner || null;

  return useQuery({
    queryKey: ["activity", queryType, queryParam, action, limit, before],
    queryFn: async () => {
      if (!queryParam) {
        return [];
      }

      const params: {
        authority?: string;
        owner?: string;
        action?: ActivityDTO['type'];
        limit: number;
        before?: string;
      } = {
        action,
        limit,
        before,
      };

      if (authority) {
        params.authority = authority;
      } else if (owner) {
        params.owner = owner;
      }

      const response = await getActivity(params);
      return response.data;
    },
    enabled: enabled && !!queryParam,
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });
}
