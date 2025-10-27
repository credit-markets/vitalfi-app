/**
 * Query invalidation helpers with retry logic
 *
 * These utilities help handle the timing gap between transaction confirmation
 * and backend webhook processing (typically 1-3 seconds, but can be up to 30s).
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Polling schedule: starts fast, then slows down
 * [2s, 2s, 2s, 3s, 3s, 5s, 5s, 10s, 10s, 15s] = 57s total, 10 requests
 */
const POLLING_SCHEDULE = [2000, 2000, 2000, 3000, 3000, 5000, 5000, 10000, 10000, 15000];

/**
 * Retry delay schedule in milliseconds
 * Total: ~80 seconds to accommodate Helius webhook processing delays
 * Schedule: 0s (immediate), 2s, 3s, 5s, 8s, 10s, 15s, 20s, 20s
 */
const RETRY_DELAYS = [0, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 20000];

/**
 * Default number of retry attempts
 */
const DEFAULT_MAX_ATTEMPTS = RETRY_DELAYS.length;

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
 * Invalidate queries with smart polling schedule
 *
 * Polls quickly at first (2s intervals) then slows down for efficiency.
 * Total: 10 requests over 57 seconds - much more backend-friendly than
 * constant 2s polling while still catching updates quickly.
 *
 * Schedule: 0s, 2s, 4s, 6s, 9s, 12s, 17s, 22s, 32s, 42s, 57s
 *
 * @param queryClient - React Query client instance
 * @param queryKeys - Array of query keys to invalidate
 *
 * @example
 * ```typescript
 * invalidateWithPolling(queryClient, [
 *   { queryKey: ["vaults-api"] },
 *   { queryKey: ["positions-api"] },
 * ]);
 * ```
 */
export function invalidateWithPolling(
  queryClient: QueryClient,
  queryKeys: Array<{ queryKey: unknown[] }>
) {
  // Clear ETag cache to prevent 304 responses with stale data
  clearETagCache();

  // Immediate first invalidation
  for (const { queryKey } of queryKeys) {
    queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active',
    });
  }

  // Schedule subsequent polls with increasing delays
  let currentIndex = 0;
  const scheduleNext = () => {
    if (currentIndex >= POLLING_SCHEDULE.length) {
      return; // Done polling
    }

    const delay = POLLING_SCHEDULE[currentIndex];
    currentIndex++;

    setTimeout(() => {
      // Clear cache and invalidate
      clearETagCache();
      for (const { queryKey } of queryKeys) {
        queryClient.invalidateQueries({
          queryKey,
          refetchType: 'active',
        });
      }

      // Schedule next poll
      scheduleNext();
    }, delay);
  };

  // Start the polling schedule
  scheduleNext();
}

/**
 * Invalidate queries with exponential backoff retries (legacy)
 *
 * Waits for backend webhook to process, then invalidates queries multiple times
 * to ensure fresh data is fetched. Custom retry schedule: 0s, 2s, 3s, 5s, 8s, 10s, 15s, 20s, 20s
 * Total wait time: ~80 seconds to handle webhook delays from Helius.
 *
 * NOTE: Consider using invalidateWithPolling for faster updates
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
  }
) {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  // Clear ETag cache to prevent 304 responses with stale data
  clearETagCache();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get delay from schedule or use last delay if beyond schedule
    const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];

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
