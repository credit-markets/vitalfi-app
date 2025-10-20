/**
 * Buffer Utility Functions
 *
 * Provides efficient buffer comparison for preventing unnecessary cache updates
 * in subscription handlers.
 */

/**
 * Compare two buffers for byte-level equality
 *
 * **WHY THIS EXISTS**:
 * When subscriptions fire, we need to check if the account data actually changed
 * before updating the React Query cache. Comparing raw buffers is faster and more
 * reliable than JSON.stringify() on decoded objects.
 *
 * **Performance**: O(n) where n = buffer length, with early exit on length mismatch
 *
 * @param a - First buffer (can be null/undefined)
 * @param b - Second buffer (can be null/undefined)
 * @returns true if buffers are equal, false otherwise
 *
 * @example
 * ```typescript
 * const oldData = accountInfo.data;
 * const newData = updatedAccountInfo.data;
 *
 * if (!bufEq(oldData, newData)) {
 *   // Only update cache if data actually changed
 *   queryClient.setQueryData(key, decode(newData));
 * }
 * ```
 */
export function bufEq(
  a?: Uint8Array | Buffer | null,
  b?: Uint8Array | Buffer | null
): boolean {
  // Handle null/undefined cases
  if (!a && !b) return true;
  if (!a || !b) return false;

  // Fast path: check length first
  if (a.length !== b.length) return false;

  // Byte-by-byte comparison (modern JS engines optimize this well)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Hash a buffer for quick comparison
 *
 * Useful when storing buffer hashes in cache metadata to detect changes
 * without storing the full buffer.
 *
 * **Note**: Uses simple FNV-1a hash. Not cryptographically secure, but fast.
 *
 * @param buf - Buffer to hash
 * @returns 32-bit hash as number
 *
 * @example
 * ```typescript
 * const hash = bufHash(accountInfo.data);
 * if (hash !== cachedHash) {
 *   // Data changed, update cache
 * }
 * ```
 */
export function bufHash(buf: Uint8Array | Buffer): number {
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < buf.length; i++) {
    hash ^= buf[i];
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0; // Convert to unsigned 32-bit
}
