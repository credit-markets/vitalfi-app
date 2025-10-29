/**
 * Hook to execute Jupiter swaps
 * Handles transaction signing and sending
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { getJupiterSwapTransaction } from "@/lib/jupiter/api";
import * as toastFns from "@/lib/toast";
import type {
  JupiterQuoteResponse,
  JupiterSwapRequest,
  SwapExecutionResult,
} from "@/lib/jupiter/types";

interface SwapParams {
  quote: JupiterQuoteResponse;
  inputAmount: number; // Human readable
  outputAmount: number; // Human readable
  inputSymbol: string;
  outputSymbol: string;
}

interface UseJupiterSwapReturn {
  swap: (params: SwapParams) => Promise<SwapExecutionResult>;
  isSwapping: boolean;
  error: Error | null;
}

/**
 * Execute Jupiter swap transaction
 */
export function useJupiterSwap(): UseJupiterSwapReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: SwapParams): Promise<SwapExecutionResult> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      // Show loading toast
      const loadingToast = toastFns.swap.loading(
        params.inputAmount,
        params.inputSymbol,
        params.outputSymbol
      );

      try {
        // Get serialized transaction from Jupiter
        const swapRequest: JupiterSwapRequest = {
          quoteResponse: params.quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        };

        const { swapTransaction } = await getJupiterSwapTransaction(
          swapRequest
        );

        // Deserialize transaction
        const transactionBuffer = Buffer.from(swapTransaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        // Sign transaction
        const signedTransaction = await signTransaction(transaction);

        // Send transaction
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );

        // Confirm transaction
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("finalized");

        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        // Dismiss loading toast
        toastFns.dismiss(loadingToast);

        // Show success toast
        toastFns.swap.success(
          signature,
          params.inputAmount,
          params.inputSymbol,
          params.outputAmount,
          params.outputSymbol
        );

        // Invalidate token balance queries
        await queryClient.invalidateQueries({
          queryKey: ["token-balance"],
        });

        return {
          signature,
          inputAmount: params.inputAmount,
          outputAmount: params.outputAmount,
          inputToken: params.inputSymbol,
          outputToken: params.outputSymbol,
        };
      } catch (error) {
        // Dismiss loading toast
        toastFns.dismiss(loadingToast);

        // Show error toast
        toastFns.swap.error(error as Error);

        throw error;
      }
    },
  });

  return {
    swap: mutation.mutateAsync,
    isSwapping: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
