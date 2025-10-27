"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { matureVault } from "@/lib/toast";
import { invalidateWithRetry } from "@/lib/utils/query-helpers";

export interface MatureVaultParams {
  vaultId: BN;
  authority: PublicKey;
  returnAmount: BN;
  assetMint: PublicKey;
}

/**
 * Hook to mature a vault with returned funds (authority only)
 *
 * Returns principal + yield to the vault and sets the payout ratio
 * for user claims. Transitions vault to Matured status.
 *
 * @example
 * ```typescript
 * const mature = useMatureVault();
 *
 * const handleMature = async () => {
 *   await mature.mutateAsync({
 *     vaultId: new BN(1),
 *     authority: authorityPubkey,
 *     returnAmount: new BN(1100000000), // 1100 tokens with 9 decimals
 *     assetMint: mintPubkey,
 *   });
 * };
 * ```
 */
export function useMatureVault() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MatureVaultParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, returnAmount, assetMint } = params;
      return client.matureVault(vaultId, returnAmount, assetMint);
    },
    onMutate: async () => {
      // Show loading toast
      matureVault.loading();
    },
    onSuccess: (txSig) => {
      matureVault.success(txSig);

      // Run retry logic in background
      invalidateWithRetry(queryClient, [
        { queryKey: ["vaults-api"] }, // Invalidate all vaults list
        { queryKey: ["activity-api"] }, // Refetch activity
        { queryKey: ["activity-infinite"] },
      ]).catch((error) => {
        console.error('[useMatureVault] Background retry failed:', error);
      });
    },
    onError: (error: Error) => {
      console.error("Mature vault error:", error);
      matureVault.error(error);
    },
  });
}
