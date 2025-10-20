"use client";

import { useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, type AccountInfo } from "@solana/web3.js";
import { useVaultClient } from "./useVaultClient";
import { useVaultProgram } from "@/lib/solana/provider";
import { onPdaChange } from "@/lib/solana/subscriptions";
import { bufEq } from "@/lib/solana/buf";
import type { PositionAccount } from "@/lib/vault-sdk";
import { getPositionPda } from "@/lib/vault-sdk/pdas";

export interface UsePositionOptions {
  enabled?: boolean;
  refetchInterval?: number;
  /** Enable real-time subscriptions (default: true) */
  subscribe?: boolean;
}

/**
 * Hook to fetch user's position in a vault with real-time updates
 *
 * Uses React Query for caching + WebSocket subscriptions for instant updates.
 * Position updates automatically when user deposits or claims.
 *
 * @param vaultPda - Vault PDA public key
 * @param userPubkey - Optional user public key (defaults to connected wallet)
 * @param options - Query and subscription options
 *
 * @example
 * ```typescript
 * const { data: position, isLoading } = usePosition(vaultPda);
 * if (position) {
 *   console.log('Deposited:', position.deposited.toString());
 * }
 * // Position updates automatically on-chain (<1s latency)
 * ```
 */
export function usePosition(
  vaultPda: PublicKey | null,
  userPubkey?: PublicKey | null,
  options: UsePositionOptions = {}
) {
  const client = useVaultClient();
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useVaultProgram();
  const lastDataRef = useRef<Buffer | null>(null);

  // Use provided user or fallback to connected wallet
  const user = userPubkey ?? publicKey;

  const subscribe = options.subscribe !== false; // Default to true

  // Memoize query key to prevent exhaustive-deps warning
  const queryKey = useMemo(
    () => ["position", vaultPda?.toBase58(), user?.toBase58()],
    [vaultPda, user]
  );

  // Compute position PDA
  const positionPda = useMemo(
    () => (vaultPda && user ? getPositionPda(vaultPda, user)[0] : null),
    [vaultPda, user]
  );

  // React Query for initial fetch and cache
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<PositionAccount | null> => {
      if (!client || !vaultPda || !user) {
        return null;
      }
      return client.getPosition(vaultPda, user);
    },
    enabled: options.enabled !== false && !!client && !!vaultPda && !!user,
    refetchInterval: subscribe ? undefined : options.refetchInterval, // Disable polling if subscribed
    staleTime: subscribe ? Infinity : 20000, // Never stale if subscribed
  });

  // Real-time subscription
  useEffect(() => {
    if (!subscribe || !positionPda || !connection || !program) {
      return;
    }

    const unsubscribe = onPdaChange(
      connection,
      positionPda,
      (accountInfo: AccountInfo<Buffer>) => {
        // Only update cache if data actually changed (buffer comparison)
        if (bufEq(lastDataRef.current, accountInfo.data)) {
          return; // No change, skip update
        }

        lastDataRef.current = accountInfo.data;

        try {
          // Decode using Anchor
          const position = program.coder.accounts.decode<PositionAccount>(
            "position",
            accountInfo.data
          );

          // Update React Query cache
          queryClient.setQueryData(queryKey, position);
        } catch (error) {
          console.error("Failed to decode position subscription update:", error);
        }
      },
      { commitment: "confirmed" }
    );

    return unsubscribe;
  }, [subscribe, positionPda, connection, program, queryClient, queryKey]);

  return query;
}

/**
 * Hook to fetch all positions for a user
 *
 * Note: List queries use polling (no subscriptions) to avoid connection limits.
 * Use individual position subscriptions for real-time updates on specific positions.
 *
 * @param userPubkey - Optional user public key (defaults to connected wallet)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: positions, isLoading } = useUserPositions();
 * ```
 */
export function useUserPositions(
  userPubkey?: PublicKey | null,
  options: UsePositionOptions = {}
) {
  const client = useVaultClient();
  const { publicKey } = useWallet();

  const user = userPubkey ?? publicKey;

  return useQuery({
    queryKey: ["user-positions", user?.toBase58()],
    queryFn: async () => {
      if (!client || !user) {
        return [];
      }
      return client.getUserPositions(user);
    },
    enabled: options.enabled !== false && !!client && !!user,
    refetchInterval: options.refetchInterval,
    staleTime: 30000,
  });
}
