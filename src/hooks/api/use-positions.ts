"use client";

import { useQuery } from "@tanstack/react-query";
import { listPositions } from "@/lib/api";

export interface UsePositionsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  limit?: number;
}

/**
 * Hook to fetch positions by owner from backend API
 *
 * @param owner - Position owner public key (base58 string)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: positions, isLoading } = useUserPositions(publicKey?.toBase58());
 * ```
 */
export function useUserPositions(
  owner: string | null,
  options: UsePositionsOptions = {}
) {
  const { limit = 50, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["user-positions", owner, limit],
    queryFn: async () => {
      if (!owner) {
        return [];
      }

      const response = await listPositions({
        owner,
        limit,
      });

      return response.data;
    },
    enabled: enabled && !!owner,
    refetchInterval,
    staleTime: 20000, // 20 seconds - positions change frequently
  });
}

/**
 * Hook to fetch positions by vault from backend API
 *
 * @param vaultPda - Vault PDA (base58 string)
 * @param options - Query options
 */
export function useVaultPositions(
  vaultPda: string | null,
  options: UsePositionsOptions = {}
) {
  const { limit = 50, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["vault-positions", vaultPda, limit],
    queryFn: async () => {
      if (!vaultPda) {
        return [];
      }

      const response = await listPositions({
        vault: vaultPda,
        limit,
      });

      return response.data;
    },
    enabled: enabled && !!vaultPda,
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single position by vault and owner
 *
 * Filters the user's positions for a specific vault.
 *
 * @param vaultPda - Vault PDA (base58 string)
 * @param owner - Owner public key (base58 string)
 * @param options - Query options
 */
export function usePosition(
  vaultPda: string | null,
  owner: string | null,
  options: Omit<UsePositionsOptions, 'limit'> = {}
) {
  const { data: positions = [], ...queryState } = useUserPositions(owner, {
    ...options,
    limit: 100,
  });

  const position = vaultPda
    ? positions.find(p => p.vaultPda === vaultPda)
    : null;

  return {
    data: position || null,
    ...queryState,
  };
}
