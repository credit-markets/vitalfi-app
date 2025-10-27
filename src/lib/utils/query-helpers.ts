/**
 * Query invalidation helpers with retry logic
 *
 * These utilities help handle the timing gap between transaction confirmation
 * and backend webhook processing (typically 1-3 seconds).
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Clear ETag cache from localStorage to force fresh fetch
 * This prevents 304 responses from returning stale cached data
 */
function clearETagCache() {
  if (typeof window === "undefined") return;
  try {
    // Clear all ETag cache entries
    localStorage.removeItem("vitalfi:etags");
  } catch (error) {
    // Silently fail - not critical
  }
}

/**
 * Invalidate queries with exponential backoff retries
 *
 * Waits for backend webhook to process, then invalidates queries multiple times
 * to ensure fresh data is fetched. Custom retry schedule: 2s, 3s, 5s, 5s, 10s, 10s, 15s, 15s
 * Total wait time: ~65 seconds to handle webhook delays from Helius.
 *
 * @param queryClient - React Query client instance
 * @param queryKeys - Array of query keys to invalidate
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * await invalidateWithRetry(queryClient, [
 *   { queryKey: ["vault", vaultId] },
 *   { queryKey: ["positions"] },
 * ]);
 * ```
 */
export async function invalidateWithRetry(
  queryClient: QueryClient,
  queryKeys: Array<{ queryKey: unknown[] }>,
  options?: {
    maxAttempts?: number;
    initialDelay?: number;
  }
) {
  const maxAttempts = options?.maxAttempts ?? 8; // 8 attempts

  // Clear ETag cache to prevent 304 responses with stale data
  clearETagCache();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Custom retry delays: 2s, 3s, 5s, 5s, 10s, 10s, 15s, 15s
    // Total: ~65 seconds
    let delay: number;
    if (attempt === 0) delay = 2000;
    else if (attempt === 1) delay = 3000;
    else if (attempt === 2 || attempt === 3) delay = 5000;
    else if (attempt === 4 || attempt === 5) delay = 10000;
    else delay = 15000;

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Invalidate all specified queries
    // React Query will automatically refetch active queries
    for (const { queryKey } of queryKeys) {
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active', // Only refetch active (mounted) queries
      });
    }
  }
}
