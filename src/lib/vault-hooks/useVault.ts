"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "./useVaultClient";
import type { VaultAccount } from "@/lib/sdk";

export interface UseVaultOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch vault account data
 *
 * Uses React Query for caching and automatic refetching.
 *
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: vault, isLoading, error } = useVault(authority, vaultId);
 * ```
 */
export function useVault(
  authority: PublicKey | null,
  vaultId: BN | null,
  options: UseVaultOptions = {}
) {
  const client = useVaultClient();

  return useQuery({
    queryKey: ["vault", authority?.toBase58(), vaultId?.toString()],
    queryFn: async (): Promise<VaultAccount | null> => {
      if (!client || !authority || !vaultId) {
        return null;
      }
      return client.getVault(authority, vaultId);
    },
    enabled: options.enabled !== false && !!client && !!authority && !!vaultId,
    refetchInterval: options.refetchInterval,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to fetch vault by PDA
 */
export function useVaultByPda(
  vaultPda: PublicKey | null,
  options: UseVaultOptions = {}
) {
  const client = useVaultClient();

  return useQuery({
    queryKey: ["vault-pda", vaultPda?.toBase58()],
    queryFn: async (): Promise<VaultAccount | null> => {
      if (!client || !vaultPda) {
        return null;
      }
      return client.getVaultByPda(vaultPda);
    },
    enabled: options.enabled !== false && !!client && !!vaultPda,
    refetchInterval: options.refetchInterval,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch all vaults for an authority
 */
export function useVaultsByAuthority(
  authority: PublicKey | null,
  options: UseVaultOptions = {}
) {
  const client = useVaultClient();

  return useQuery({
    queryKey: ["vaults-by-authority", authority?.toBase58()],
    queryFn: async () => {
      if (!client || !authority) {
        return [];
      }
      return client.getVaultsByAuthority(authority);
    },
    enabled: options.enabled !== false && !!client && !!authority,
    refetchInterval: options.refetchInterval,
    staleTime: 60000, // 1 minute for list queries
  });
}

/**
 * Hook to fetch all vaults
 *
 * WARNING: This can be expensive on mainnet. Use with caution.
 */
export function useAllVaults(options: UseVaultOptions = {}) {
  const client = useVaultClient();

  return useQuery({
    queryKey: ["all-vaults"],
    queryFn: async () => {
      if (!client) {
        return [];
      }
      return client.getAllVaults();
    },
    enabled: options.enabled !== false && !!client,
    refetchInterval: options.refetchInterval,
    staleTime: 120000, // 2 minutes for expensive queries
  });
}
