"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { claim as claimToast } from "@/lib/toast";

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
    onSuccess: (txSig, params) => {
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({
        queryKey: ["vault", params.authority.toBase58(), params.vaultId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["position"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-positions"],
      });

      claimToast.success(txSig);
    },
    onError: (error: Error) => {
      console.error("Claim error:", error);
      claimToast.error(error);
    },
  });
}
