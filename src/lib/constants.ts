/**
 * Application Constants
 *
 * Centralized constants used across the application.
 * Separates configuration from business logic.
 */

// ============================================================================
// Cache & Storage
// ============================================================================

export const ETAG_CACHE_KEY = "vitalfi:etags";
export const DATA_CACHE_PREFIX = "vitalfi:cache:";

// ============================================================================
// React Query Configuration
// ============================================================================

// Cache timing (matches backend s-maxage)
export const QUERY_STALE_TIME_MS = 30_000; // 30 seconds
export const QUERY_GC_TIME_MS = 5 * 60 * 1000; // 5 minutes

// Activity queries update more frequently
export const ACTIVITY_STALE_TIME_MS = 15_000; // 15 seconds

// Retry configuration
export const RETRY_BASE_MS = 1000;
export const RETRY_MAX_MS = 30000;
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Calculate exponential backoff delay for retries
 */
export function calculateRetryDelay(attemptIndex: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** attemptIndex, RETRY_MAX_MS);
}

// ============================================================================
// Token Configuration
// ============================================================================

// Default decimals for SOL (most common case)
export const DEFAULT_DECIMALS = 9;

// Precision loss warning threshold (percentage)
// Only log warnings if precision loss exceeds this threshold
export const PRECISION_LOSS_THRESHOLD = 0.1; // 0.1%

// ============================================================================
// UI/UX Constants
// ============================================================================

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
