"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { finalizeFunding } from "@/lib/toast";
import { invalidateWithRetry } from "@/lib/utils/query-helpers";

export interface FinalizeFundingParams {
  vaultId: BN;
  authority: PublicKey;
  assetMint: PublicKey;
}

/**
 * Hook to finalize vault funding (authority only)
 *
 * Checks if 2/3 funding threshold is met and transitions vault
 * to either Active (success) or Canceled (failure) status.
 *
 * @example
 * ```typescript
 * const finalize = useFinalizeFunding();
 *
 * const handleFinalize = async () => {
 *   await finalize.mutateAsync({
 *     vaultId: new BN(1),
 *     authority: authorityPubkey,
 *     assetMint: mintPubkey,
 *   });
 * };
 * ```
 */
export function useFinalizeFunding() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: FinalizeFundingParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, assetMint } = params;
      return client.finalizeFunding(vaultId, assetMint);
    },
    onMutate: async () => {
      // Show loading toast
      finalizeFunding.loading();
    },
    onSuccess: (txSig) => {
      finalizeFunding.success(txSig);

      // Run retry logic in background
      invalidateWithRetry(queryClient, [
        { queryKey: ["vaults-api"] }, // Invalidate all vaults list
        { queryKey: ["activity-api"] }, // Refetch activity
        { queryKey: ["activity-infinite"] },
      ]).catch((error) => {
        console.error('[useFinalizeFunding] Background retry failed:', error);
      });
    },
    onError: (error: Error) => {
      console.error("Finalize funding error:", error);
      finalizeFunding.error(error);
    },
  });
}
