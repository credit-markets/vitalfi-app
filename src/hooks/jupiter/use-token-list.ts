/**
 * Hook to fetch and search Jupiter token list
 */

import { useQuery } from "@tanstack/react-query";
import { getJupiterTokenList, searchTokens } from "@/lib/jupiter/api";
import { POPULAR_TOKENS } from "@/lib/jupiter/tokens";
import type { JupiterToken } from "@/lib/jupiter/types";

interface UseTokenListReturn {
  tokens: JupiterToken[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch full Jupiter token list
 * Cached for 1 hour
 */
export function useTokenList(): UseTokenListReturn {
  const queryResult = useQuery({
    queryKey: ["jupiter-token-list"],
    queryFn: getJupiterTokenList,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 3,
  });

  return {
    tokens: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    error: queryResult.error as Error | null,
  };
}

interface UseTokenSearchReturn {
  results: JupiterToken[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Search tokens by query string
 */
export function useTokenSearch(query: string): UseTokenSearchReturn {
  const queryResult = useQuery({
    queryKey: ["jupiter-token-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return POPULAR_TOKENS; // Show popular tokens by default
      }

      return searchTokens(query);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return {
    results: queryResult.data ?? POPULAR_TOKENS,
    isLoading: queryResult.isLoading,
    error: queryResult.error as Error | null,
  };
}

interface UseTokenInfoReturn {
  token: JupiterToken | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get token info by mint address
 */
export function useTokenInfo(mint: string | null): UseTokenInfoReturn {
  const { tokens } = useTokenList();

  const token = mint ? tokens.find((t) => t.address === mint) ?? null : null;

  return {
    token,
    isLoading: false,
    error: null,
  };
}
