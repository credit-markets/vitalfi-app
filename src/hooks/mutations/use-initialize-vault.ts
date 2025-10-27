"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { vaultInit } from "@/lib/toast";
import { invalidateWithRetry } from "@/lib/utils/query-helpers";

export interface InitializeVaultParams {
  vaultId: BN;
  cap: BN;
  targetApyBps: number;
  fundingEndTs: BN;
  maturityTs: BN;
  minDeposit: BN;
  assetMint: PublicKey;
}

/**
 * Hook to initialize a new vault (authority only)
 *
 * @example
 * ```typescript
 * const initializeVault = useInitializeVault();
 *
 * const handleInitialize = async () => {
 *   await initializeVault.mutateAsync({
 *     vaultId: new BN(1),
 *     cap: new BN(1000000),
 *     targetApyBps: 1200,
 *     fundingEndTs: new BN(Date.now() / 1000 + 600),
 *     maturityTs: new BN(Date.now() / 1000 + 1200),
 *     minDeposit: new BN(100),
 *     assetMint: mintPubkey,
 *   });
 * };
 * ```
 */
export function useInitializeVault() {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InitializeVaultParams): Promise<string> => {
      if (!client) {
        throw new Error("Wallet not connected");
      }

      const { vaultId, cap, targetApyBps, fundingEndTs, maturityTs, minDeposit, assetMint } =
        params;
      return client.initializeVault(
        vaultId,
        cap,
        targetApyBps,
        fundingEndTs,
        maturityTs,
        minDeposit,
        assetMint
      );
    },
    onMutate: async () => {
      // Show loading toast
      vaultInit.loading();
    },
    onSuccess: (txSig, params) => {
      vaultInit.success(txSig, params.vaultId.toString());

      // Run retry logic in background
      invalidateWithRetry(queryClient, [
        { queryKey: ["vaults-api"] }, // Invalidate all vaults list
        { queryKey: ["activity-api"] }, // Refetch activity to show vault creation
        { queryKey: ["activity-infinite"] },
      ]).catch((error) => {
        console.error('[useInitializeVault] Background retry failed:', error);
      });
    },
    onError: (error: Error) => {
      console.error("Initialize vault error:", error);
      vaultInit.error(error);
    },
  });
}
