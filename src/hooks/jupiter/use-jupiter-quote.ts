/**
 * Hook to fetch Jupiter swap quotes
 * Supports automatic refetching and caching
 */

import { useQuery } from "@tanstack/react-query";
import { getJupiterQuote } from "@/lib/jupiter/api";
import type {
  JupiterQuoteRequest,
  JupiterQuoteResponse,
  SwapPreview,
  JupiterToken,
} from "@/lib/jupiter/types";

interface UseJupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string; // Base units
  slippageBps?: number;
  enabled?: boolean;
}

interface UseJupiterQuoteReturn {
  quote: JupiterQuoteResponse | null;
  preview: SwapPreview | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Convert Jupiter quote to user-friendly preview
 */
function createSwapPreview(
  quote: JupiterQuoteResponse,
  inputToken: JupiterToken,
  outputToken: JupiterToken
): SwapPreview {
  const inputAmount = Number(quote.inAmount) / 10 ** inputToken.decimals;
  const outputAmount = Number(quote.outAmount) / 10 ** outputToken.decimals;
  const minimumReceived =
    Number(quote.otherAmountThreshold) / 10 ** outputToken.decimals;
  const priceImpact = Math.abs(Number(quote.priceImpactPct));

  // Calculate total fees in output token terms
  const totalFee = quote.routePlan.reduce((sum, plan) => {
    const feeAmount = Number(plan.swapInfo.feeAmount);
    const feeMint = plan.swapInfo.feeMint;

    // Convert fee to output token if needed
    if (feeMint === outputToken.address) {
      return sum + feeAmount / 10 ** outputToken.decimals;
    }

    // Approximate fee in output token terms (simplified)
    return sum;
  }, 0);

  // Extract route labels
  const route = quote.routePlan.map(
    (plan) => plan.swapInfo.label || "Unknown DEX"
  );

  return {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    priceImpact,
    minimumReceived,
    fee: totalFee,
    route,
    slippageBps: quote.slippageBps,
  };
}

/**
 * Fetch Jupiter swap quote with automatic updates
 */
export function useJupiterQuote(
  params: UseJupiterQuoteParams,
  inputToken: JupiterToken | null,
  outputToken: JupiterToken | null
): UseJupiterQuoteReturn {
  const isEnabled =
    params.enabled !== false &&
    !!params.inputMint &&
    !!params.outputMint &&
    !!params.amount &&
    Number(params.amount) > 0 &&
    !!inputToken &&
    !!outputToken;

  const queryResult = useQuery({
    queryKey: [
      "jupiter-quote",
      params.inputMint,
      params.outputMint,
      params.amount,
      params.slippageBps ?? 50,
    ],
    queryFn: async () => {
      const request: JupiterQuoteRequest = {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps ?? 50,
        swapMode: "ExactIn",
      };

      return getJupiterQuote(request);
    },
    enabled: isEnabled,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds for fresh quotes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const preview =
    queryResult.data && inputToken && outputToken
      ? createSwapPreview(queryResult.data, inputToken, outputToken)
      : null;

  return {
    quote: queryResult.data ?? null,
    preview,
    isLoading: queryResult.isLoading,
    error: queryResult.error as Error | null,
    refetch: queryResult.refetch,
  };
}
