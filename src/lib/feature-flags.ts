/**
 * Feature Flags
 *
 * Centralized feature flag management with deterministic A/B assignment.
 *
 * RESILIENCY PATCH: Deterministic feature flags
 * - Stable per-user assignment (based on wallet address)
 * - Percentage-based rollout
 * - Environment variable override
 */

/**
 * Check if backend API should be used
 *
 * Decision logic:
 * 1. If NEXT_PUBLIC_USE_BACKEND_API is explicitly set, use that value
 * 2. Otherwise, use percentage-based rollout (deterministic per user)
 *
 * @param userId - User identifier for deterministic assignment (e.g., wallet address)
 * @returns true if backend API should be used
 */
export function shouldUseBackendAPI(userId?: string): boolean {
  const envFlag = process.env.NEXT_PUBLIC_USE_BACKEND_API;

  // Explicit override via environment variable
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;

  // Percentage-based rollout (deterministic per user)
  const rolloutPercentage =
    parseInt(process.env.NEXT_PUBLIC_BACKEND_API_ROLLOUT_PCT || "0", 10);

  if (rolloutPercentage === 0) return false;
  if (rolloutPercentage >= 100) return true;

  // Deterministic assignment based on userId
  if (!userId) {
    // No user ID, use random (will vary per session)
    // This is acceptable for anonymous users
    return Math.random() * 100 < rolloutPercentage;
  }

  // Hash userId to get deterministic number
  const hash = simpleHash(userId);
  const bucket = hash % 100; // 0-99
  return bucket < rolloutPercentage;
}

/**
 * Simple string hash function for deterministic assignment
 *
 * Uses DJB2 hash algorithm (simple, fast, good distribution)
 *
 * @param str - Input string to hash
 * @returns Hash value (positive integer)
 */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Get feature flag for infinite scroll activity feed
 *
 * @returns true if infinite scroll should be enabled
 */
export function shouldUseInfiniteScroll(): boolean {
  const envFlag = process.env.NEXT_PUBLIC_USE_INFINITE_SCROLL;
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return true; // Default: enabled
}
