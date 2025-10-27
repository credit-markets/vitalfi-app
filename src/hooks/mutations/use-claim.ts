"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { claim as claimToast } from "@/lib/toast";
import { invalidateWithRetry } from "@/lib/utils/query-helpers";

export interface ClaimParams {
  vaultId: BN;
  authority: PublicKey;
  assetMint: PublicKey;
}

/**
 * Hook to claim refund or payout from a vault
 *
 * @example
 * ```typescript
 * const claim = useClaim();
 *
 * const handleClaim = async () => {
 *   await claim.mutateAsync({
 *     vaultId: new BN(1),
 *     authority: authorityPubkey,
 *     assetMint: mintPubkey,
 *   });
 * };
 * ```
 */
export function useClaim() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ClaimParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, authority, assetMint } = params;
      return client.claim(vaultId, authority, assetMint);
    },
    onMutate: async () => {
      // Show loading toast
      claimToast.loading();
    },
    onSuccess: (txSig) => {
      claimToast.success(txSig);

      // Run retry logic in background without blocking mutation completion
      // This allows the button to return to normal state immediately
      invalidateWithRetry(queryClient, [
        { queryKey: ["vaults-api"] }, // Refetch all vaults (includes this vault)
        { queryKey: ["positions-api"] }, // Refetch positions
        { queryKey: ["activity-api"] }, // Refetch activity feed
        { queryKey: ["activity-infinite"] }, // Refetch infinite scroll activity
        { queryKey: ["portfolio-api"] }, // Refetch portfolio data
      ]).catch((error) => {
        console.error('[useClaim] Background retry failed:', error);
      });
    },
    onError: (error: Error) => {
      console.error("Claim error:", error);
      claimToast.error(error);
    },
  });
}
