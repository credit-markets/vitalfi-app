"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { closeVault } from "@/lib/toast";
import { invalidateWithRetry } from "@/lib/utils/query-helpers";

export interface CloseVaultParams {
  vaultId: BN;
  authority: PublicKey;
}

/**
 * Hook to close a vault and reclaim rent (authority only)
 *
 * Closes vault and token account after all users have claimed.
 * Vault must have zero (or dust) balance and be in Matured or Canceled status.
 *
 * @example
 * ```typescript
 * const close = useCloseVault();
 *
 * const handleClose = async () => {
 *   await close.mutateAsync({
 *     vaultId: new BN(1),
 *     authority: authorityPubkey,
 *   });
 * };
 * ```
 */
export function useCloseVault() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CloseVaultParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId } = params;
      return client.closeVault(vaultId);
    },
    onMutate: async () => {
      // Show loading toast
      closeVault.loading();
    },
    onSuccess: (txSig) => {
      closeVault.success(txSig);

      // Run retry logic in background
      invalidateWithRetry(queryClient, [
        { queryKey: ["vaults-api"] }, // Invalidate all vaults list
        { queryKey: ["activity-api"] }, // Refetch activity
        { queryKey: ["activity-infinite"] },
      ]).catch((error) => {
        console.error('[useCloseVault] Background retry failed:', error);
      });
    },
    onError: (error: Error) => {
      console.error("Close vault error:", error);
      closeVault.error(error);
    },
  });
}
