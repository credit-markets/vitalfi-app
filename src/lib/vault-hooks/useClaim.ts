"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "./useVaultClient";
import { useVaultProgram } from "@/lib/solana/provider";
import { getVaultPda, getPositionPda } from "@/lib/vault-sdk/pdas";
import { reconcileFinalized } from "@/lib/utils/reconcile";
import { toast } from "sonner";

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
  const { connection } = useConnection();
  const { publicKey: user } = useWallet();
  const { program } = useVaultProgram();

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
      toast.loading("Claiming...", { id: "claim" });
    },
    onSuccess: async (txSig, params) => {
      const { vaultId, authority } = params;

      // Narrow invalidations - only invalidate specific vault and position
      const vaultPda = getVaultPda(authority, vaultId)[0];
      const positionPda = user ? getPositionPda(vaultPda, user)[0] : null;

      // Invalidate specific vault query
      queryClient.invalidateQueries({
        queryKey: ["vault", authority.toBase58(), vaultId.toString()],
      });

      // Invalidate specific position query (not all positions)
      if (positionPda && user) {
        queryClient.invalidateQueries({
          queryKey: ["position", vaultPda.toBase58(), user.toBase58()],
        });
      }

      // Invalidate user positions list
      if (user) {
        queryClient.invalidateQueries({
          queryKey: ["user-positions", user.toBase58()],
        });
      }

      toast.success("Claim successful!", {
        id: "claim",
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

      // Background: Reconcile to finalized commitment
      if (program && positionPda) {
        reconcileFinalized(
          connection,
          [vaultPda, positionPda],
          (data) => {
            // Determine account type from size
            if (data.length === 200) {
              return program.coder.accounts.decode("vault", data);
            } else {
              return program.coder.accounts.decode("position", data);
            }
          },
          (pubkey, account) => {
            // Update cache with finalized data if it differs
            if (pubkey.equals(vaultPda)) {
              queryClient.setQueryData(
                ["vault", authority.toBase58(), vaultId.toString()],
                account
              );
            } else if (user && pubkey.equals(positionPda)) {
              queryClient.setQueryData(
                ["position", vaultPda.toBase58(), user.toBase58()],
                account
              );
            }
          }
        );
      }
    },
    onError: (error: Error) => {
      console.error("Claim error:", error);
      toast.error("Claim failed", {
        id: "claim",
        description: error.message || "Transaction failed. Please try again.",
      });
    },
  });
}
