"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVaultClient } from "./useVaultClient";
import type { PositionAccount } from "@/lib/sdk";

export interface UsePositionOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch user's position in a vault
 *
 * @param vaultPda - Vault PDA public key
 * @param userPubkey - Optional user public key (defaults to connected wallet)
 * @param options - Query options
 *
 * @example
 * ```typescript
 * const { data: position, isLoading } = usePosition(vaultPda);
 * if (position) {
 *   console.log('Deposited:', position.deposited.toString());
 * }
 * ```
 */
export function usePosition(
  vaultPda: PublicKey | null,
  userPubkey?: PublicKey | null,
  options: UsePositionOptions = {}
) {
  const client = useVaultClient();
  const { publicKey } = useWallet();

  // Use provided user or fallback to connected wallet
  const user = userPubkey ?? publicKey;

  return useQuery({
    queryKey: ["position", vaultPda?.toBase58(), user?.toBase58()],
    queryFn: async (): Promise<PositionAccount | null> => {
      if (!client || !vaultPda || !user) {
        return null;
      }
      return client.getPosition(vaultPda, user);
    },
    enabled: options.enabled !== false && !!client && !!vaultPda && !!user,
    refetchInterval: options.refetchInterval,
    staleTime: 20000, // Consider data fresh for 20 seconds
  });
}

/**
 * Hook to fetch all positions for a user
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
