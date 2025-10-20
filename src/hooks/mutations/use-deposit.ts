"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { toast } from "sonner";

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
      toast.loading("Depositing...", { id: "deposit" });
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

      toast.success("Deposit successful!", {
        id: "deposit",
        description: `Transaction: ${txSig.slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () => {
            const cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
            window.open(
              `https://explorer.solana.com/tx/${txSig}?cluster=${cluster}`,
              "_blank"
            );
          },
        },
      });
    },
    onError: (error: Error) => {
      console.error("Deposit error:", error);
      toast.error("Deposit failed", {
        id: "deposit",
        description: error.message || "Transaction failed. Please try again.",
      });
    },
  });
}
