"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { deposit as depositToast } from "@/lib/toast";

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

      depositToast.success(txSig);
    },
    onError: (error: Error) => {
      console.error("Deposit error:", error);
      depositToast.error(error);
    },
  });
}
