"use client";

import { useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, type AccountInfo } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "./useVaultClient";
import { useVaultProgram } from "@/lib/solana/provider";
import { onPdaChange } from "@/lib/solana/subscriptions";
import { bufEq } from "@/lib/solana/buf";
import type { VaultAccount } from "@/lib/vault-sdk";
import { getVaultPda } from "@/lib/vault-sdk/pdas";

export interface UseVaultOptions {
  enabled?: boolean;
  refetchInterval?: number;
  /** Enable real-time subscriptions (default: true) */
  subscribe?: boolean;
}

/**
 * Hook to fetch vault account data with real-time updates
 *
 * Uses React Query for caching + WebSocket subscriptions for instant updates.
 * Subscriptions prevent unnecessary re-renders by comparing raw buffers.
 *
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @param options - Query and subscription options
 *
 * @example
 * ```typescript
 * const { data: vault, isLoading, error } = useVault(authority, vaultId);
 * // Vault updates automatically when on-chain data changes (<1s latency)
 * ```
 */
export function useVault(
  authority: PublicKey | null,
  vaultId: BN | null,
  options: UseVaultOptions = {}
) {
  const client = useVaultClient();
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const { program } = useVaultProgram();
  const lastDataRef = useRef<Buffer | null>(null);

  const subscribe = options.subscribe !== false; // Default to true

  // Memoize query key to prevent exhaustive-deps warning
  const queryKey = useMemo(
    () => ["vault", authority?.toBase58(), vaultId?.toString()],
    [authority, vaultId]
  );

  // Compute vault PDA
  const vaultPda = useMemo(
    () => (authority && vaultId ? getVaultPda(authority, vaultId)[0] : null),
    [authority, vaultId]
  );

  // React Query for initial fetch and cache
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<VaultAccount | null> => {
      if (!client || !authority || !vaultId) {
        return null;
      }
      return client.getVault(authority, vaultId);
    },
    enabled: options.enabled !== false && !!client && !!authority && !!vaultId,
    refetchInterval: subscribe ? undefined : options.refetchInterval, // Disable polling if subscribed
    staleTime: subscribe ? Infinity : 30000, // Never stale if subscribed
  });

  // Real-time subscription
  useEffect(() => {
    if (!subscribe || !vaultPda || !connection || !program) {
      return;
    }

    const unsubscribe = onPdaChange(
      connection,
      vaultPda,
      (accountInfo: AccountInfo<Buffer>) => {
        // Only update cache if data actually changed (buffer comparison)
        if (bufEq(lastDataRef.current, accountInfo.data)) {
          return; // No change, skip update
        }

        lastDataRef.current = accountInfo.data;

        try {
          // Decode using Anchor
          const vault = program.coder.accounts.decode<VaultAccount>(
            "vault",
            accountInfo.data
          );

          // Update React Query cache
          queryClient.setQueryData(queryKey, vault);
        } catch (error) {
          console.error("Failed to decode vault subscription update:", error);
        }
      },
      { commitment: "confirmed" }
    );

    return unsubscribe;
  }, [subscribe, vaultPda, connection, program, queryClient, queryKey]);

  return query;
}

/**
 * Hook to fetch vault by PDA with real-time updates
 */
export function useVaultByPda(
  vaultPda: PublicKey | null,
  options: UseVaultOptions = {}
) {
  const client = useVaultClient();
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const { program } = useVaultProgram();
  const lastDataRef = useRef<Buffer | null>(null);

  const subscribe = options.subscribe !== false;

  // Memoize query key
  const queryKey = useMemo(
    () => ["vault-pda", vaultPda?.toBase58()],
    [vaultPda]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<VaultAccount | null> => {
      if (!client || !vaultPda) {
        return null;
      }
      return client.getVaultByPda(vaultPda);
    },
    enabled: options.enabled !== false && !!client && !!vaultPda,
    refetchInterval: subscribe ? undefined : options.refetchInterval,
    staleTime: subscribe ? Infinity : 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!subscribe || !vaultPda || !connection || !program) {
      return;
    }

    const unsubscribe = onPdaChange(
      connection,
      vaultPda,
      (accountInfo: AccountInfo<Buffer>) => {
        if (bufEq(lastDataRef.current, accountInfo.data)) {
          return;
        }

        lastDataRef.current = accountInfo.data;

        try {
          const vault = program.coder.accounts.decode<VaultAccount>(
            "vault",
            accountInfo.data
          );
          queryClient.setQueryData(queryKey, vault);
        } catch (error) {
          console.error("Failed to decode vault subscription update:", error);
        }
      },
      { commitment: "confirmed" }
    );

    return unsubscribe;
  }, [subscribe, vaultPda, connection, program, queryClient, queryKey]);

  return query;
}

/**
 * Hook to fetch all vaults for an authority
 *
 * Note: List queries use polling (no subscriptions) to avoid connection limits.
 * Use individual vault subscriptions for real-time updates on specific vaults.
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
