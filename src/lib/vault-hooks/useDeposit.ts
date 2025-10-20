"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "./useVaultClient";
import { useVaultProgram } from "@/lib/solana/provider";
import { getVaultPda, getPositionPda } from "@/lib/vault-sdk/pdas";
import { VaultLayout, PositionLayout } from "@/lib/vault-sdk/layout";
import { reconcileFinalized } from "@/lib/utils/reconcile";
import { toast } from "sonner";
import { trackTransactionError, getUserFriendlyErrorMessage } from "@/lib/error-tracking";
import { retryTransaction } from "@/lib/utils/retry";

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
  const { connection } = useConnection();
  const { publicKey: user } = useWallet();
  const { program } = useVaultProgram();

  return useMutation({
    mutationFn: async (params: DepositParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, authority, amount, assetMint } = params;

      // Retry transaction with exponential backoff
      // SAFETY: Retries are safe here because:
      // 1. The program enforces idempotency (duplicate deposits will fail with PROGRAM_ERROR)
      // 2. Only transient errors (RPC timeout, network) are retried
      // 3. Program errors (insufficient funds, invalid state) fail immediately
      return retryTransaction(
        () => client.deposit(vaultId, authority, amount, assetMint),
        "deposit",
        {
          maxAttempts: 3,
          onRetry: (attempt) => {
            toast.loading(`Retrying deposit (${attempt}/3)...`, { id: "deposit" });
          },
        }
      );
    },
    onMutate: async () => {
      // Show loading toast
      toast.loading("Depositing...", { id: "deposit" });
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

      // Background: Reconcile to finalized commitment
      if (program && positionPda) {
        reconcileFinalized(
          connection,
          [vaultPda, positionPda],
          (data) => {
            // Determine account type from size
            if (data.length === VaultLayout.size) {
              return program.coder.accounts.decode("vault", data);
            } else if (data.length === PositionLayout.size) {
              return program.coder.accounts.decode("position", data);
            } else {
              throw new Error(`Unknown account size: ${data.length}`);
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
    onError: (error: Error, params) => {
      // Track error with context
      trackTransactionError(error, {
        operation: "deposit",
        vault: params.authority.toBase58(),
        user: user?.toBase58(),
      });

      // Show user-friendly error message
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      toast.error("Deposit failed", {
        id: "deposit",
        description: friendlyMessage,
      });
    },
  });
}
