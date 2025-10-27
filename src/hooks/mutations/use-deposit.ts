"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { deposit as depositToast } from "@/lib/toast";
import { invalidateWithPolling } from "@/lib/utils/query-helpers";

export interface DepositParams {
  vaultId: BN;
  authority: PublicKey;
  amount: BN;
  assetMint: PublicKey;
}

/**
 * Hook to deposit tokens into a vault
 *
 * @example
 * ```typescript
 * const deposit = useDeposit();
 *
 * const handleDeposit = async () => {
 *   await deposit.mutateAsync({
 *     vaultId: new BN(1),
 *     authority: authorityPubkey,
 *     amount: new BN(1000),
 *     assetMint: mintPubkey,
 *   });
 * };
 * ```
 */
export function useDeposit() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DepositParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, authority, amount, assetMint } = params;
      return client.deposit(vaultId, authority, amount, assetMint);
    },
    onMutate: async () => {
      // Show loading toast
      depositToast.loading();
    },
    onSuccess: (txSig) => {
      depositToast.success(txSig);

      // Start aggressive polling for 45 seconds (every 2s)
      // This catches backend webhook updates much faster than exponential backoff
      invalidateWithPolling(queryClient, [
        { queryKey: ["vaults-api"] }, // Refetch all vaults (includes this vault)
        { queryKey: ["positions-api"] }, // Refetch positions
        { queryKey: ["activity-api"] }, // Refetch activity feed
        { queryKey: ["activity-infinite"] }, // Refetch infinite scroll activity
        { queryKey: ["portfolio-api"] }, // Refetch portfolio data
      ]);
    },
    onError: (error: Error) => {
      console.error("Deposit error:", error);
      depositToast.error(error);
    },
  });
}
