"use client";

import { useQuery } from "@tanstack/react-query";
import { listVaults } from "@/lib/api";

export interface UseVaultsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  status?: "Funding" | "Active" | "Matured" | "Canceled";
  limit?: number;
}

/**
 * Hook to fetch vaults by authority from backend API
 *
 * Uses React Query for caching and automatic refetching.
 * Replaces direct RPC calls with backend API calls.
 *
 * @param authority - Vault authority public key (base58 string)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useVaults(authorityPubkey.toBase58());
 * ```
 */
export function useVaults(
  authority: string | null,
  options: UseVaultsOptions = {}
) {
  const { status, limit = 50, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["vaults", authority, status, limit],
    queryFn: async () => {
      if (!authority) {
        return [];
      }

      const response = await listVaults({
        authority,
        status,
        limit,
      });

      return response.data;
    },
    enabled: enabled && !!authority,
    refetchInterval,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to fetch a single vault by PDA from the vaults list
 *
 * This is a convenience hook that filters the vaults list by PDA.
 * For more efficient single-vault fetching, consider adding a
 * dedicated backend endpoint.
 *
 * @param authority - Vault authority (required for API call)
 * @param vaultPda - Vault PDA to filter for
 * @param options - Query options
 */
export function useVaultByPda(
  authority: string | null,
  vaultPda: string | null,
  options: Omit<UseVaultsOptions, 'status' | 'limit'> = {}
) {
  const { data: vaults = [], ...queryState } = useVaults(authority, {
    ...options,
    limit: 100, // Fetch more to increase chance of finding the vault
  });

  const vault = vaultPda ? vaults.find(v => v.vaultPda === vaultPda) : null;

  return {
    data: vault || null,
    ...queryState,
  };
}

/**
 * Hook to fetch all vaults (across all authorities)
 *
 * WARNING: This requires authority parameter in the backend API.
 * If you need truly all vaults, the backend API needs to be updated.
 * For now, this returns vaults for a specific authority.
 */
export function useAllVaults(
  authority: string | null,
  options: UseVaultsOptions = {}
) {
  return useVaults(authority, {
    ...options,
    limit: 100,
  });
}
