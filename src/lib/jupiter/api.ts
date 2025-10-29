/**
 * Jupiter V6 API Client
 * Documentation: https://station.jup.ag/docs/apis/swap-api
 */

import type {
  JupiterQuoteRequest,
  JupiterQuoteResponse,
  JupiterSwapRequest,
  JupiterSwapResponse,
  JupiterToken,
} from "./types";

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";
const JUPITER_TOKEN_LIST = "https://token.jup.ag/strict";

/**
 * Fetch swap quote from Jupiter
 */
export async function getJupiterQuote(
  params: JupiterQuoteRequest
): Promise<JupiterQuoteResponse> {
  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: (params.slippageBps ?? 50).toString(),
    ...(params.swapMode && { swapMode: params.swapMode }),
    ...(params.onlyDirectRoutes !== undefined && {
      onlyDirectRoutes: params.onlyDirectRoutes.toString(),
    }),
    ...(params.maxAccounts && { maxAccounts: params.maxAccounts.toString() }),
  });

  const response = await fetch(`${JUPITER_API_BASE}/quote?${queryParams}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Jupiter API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get serialized swap transaction from Jupiter
 */
export async function getJupiterSwapTransaction(
  params: JupiterSwapRequest
): Promise<JupiterSwapResponse> {
  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Jupiter swap API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch verified token list from Jupiter
 * Cached for performance
 */
let tokenListCache: JupiterToken[] | null = null;
let tokenListCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getJupiterTokenList(): Promise<JupiterToken[]> {
  const now = Date.now();

  // Return cached list if still fresh
  if (tokenListCache && now - tokenListCacheTime < CACHE_DURATION) {
    return tokenListCache;
  }

  const response = await fetch(JUPITER_TOKEN_LIST);

  if (!response.ok) {
    throw new Error(`Failed to fetch token list: ${response.statusText}`);
  }

  const tokens: JupiterToken[] = await response.json();

  // Update cache
  tokenListCache = tokens;
  tokenListCacheTime = now;

  return tokens;
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(
  query: string
): Promise<JupiterToken[]> {
  const tokens = await getJupiterTokenList();
  const lowerQuery = query.toLowerCase();

  return tokens
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 20); // Limit results
}

/**
 * Get token info by mint address
 */
export async function getTokenByMint(
  mint: string
): Promise<JupiterToken | null> {
  const tokens = await getJupiterTokenList();
  return tokens.find((token) => token.address === mint) || null;
}
