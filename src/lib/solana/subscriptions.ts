/**
 * Real-time Account Subscriptions
 *
 * Provides WebSocket subscriptions to Solana accounts using onAccountChange.
 * Significantly reduces RPC calls vs. polling (e.g., 2 calls/min → 1 persistent connection).
 *
 * **Pattern**: Subscribe → Decode → Debounce → Update Cache
 * **Commitment**: "confirmed" for fast UX, reconcile to "finalized" after writes
 */

import type {
  Connection,
  PublicKey,
  AccountChangeCallback,
  AccountInfo,
  Commitment,
  GetProgramAccountsFilter,
} from "@solana/web3.js";

/**
 * Subscribe to changes on a single PDA account
 *
 * Uses `connection.onAccountChange` to watch for on-chain updates.
 * Automatically calls the callback when the account data changes.
 *
 * @param connection - Solana RPC connection
 * @param pubkey - Account public key to watch
 * @param callback - Function called when account changes (receives AccountInfo)
 * @param options - Subscription options (commitment, encoding)
 * @returns Cleanup function that unsubscribes the listener
 *
 * @example
 * ```typescript
 * const unsubscribe = onPdaChange(
 *   connection,
 *   vaultPda,
 *   (accountInfo) => {
 *     const vault = program.coder.accounts.decode('vault', accountInfo.data);
 *     queryClient.setQueryData(['vault', vaultPda.toString()], vault);
 *   },
 *   { commitment: 'confirmed' }
 * );
 *
 * // Later: cleanup
 * useEffect(() => unsubscribe, []);
 * ```
 */
export function onPdaChange(
  connection: Connection,
  pubkey: PublicKey,
  callback: AccountChangeCallback,
  options?: {
    commitment?: Commitment;
    encoding?: "base64" | "jsonParsed";
  }
): () => void {
  const subscriptionId = connection.onAccountChange(
    pubkey,
    callback,
    options?.commitment || "confirmed"
  );

  // Return cleanup function
  return () => {
    connection.removeAccountChangeListener(subscriptionId);
  };
}

/**
 * Subscribe to changes on multiple accounts matching a program filter
 *
 * Uses `connection.onProgramAccountChange` to watch for updates to any account
 * owned by the program that matches the provided filters.
 *
 * **Note**: This can be expensive if filters match many accounts. Use narrow filters.
 *
 * @param connection - Solana RPC connection
 * @param programId - Program ID that owns the accounts
 * @param callback - Function called when any matching account changes
 * @param filters - Optional memcmp/dataSize filters to narrow results
 * @param options - Subscription options (commitment)
 * @returns Cleanup function that unsubscribes the listener
 *
 * @example
 * ```typescript
 * // Subscribe to all positions for a specific user
 * const unsubscribe = onProgramChange(
 *   connection,
 *   PROGRAM_ID,
 *   (keyedAccountInfo) => {
 *     const position = program.coder.accounts.decode('position', keyedAccountInfo.accountInfo.data);
 *     // Update cache...
 *   },
 *   [memcmpFilterOwner(userPubkey)],
 *   { commitment: 'confirmed' }
 * );
 * ```
 */
export function onProgramChange(
  connection: Connection,
  programId: PublicKey,
  callback: (keyedAccountInfo: {
    accountId: PublicKey;
    accountInfo: AccountInfo<Buffer>;
  }) => void,
  filters?: GetProgramAccountsFilter[],
  options?: {
    commitment?: Commitment;
  }
): () => void {
  const subscriptionId = connection.onProgramAccountChange(
    programId,
    callback,
    options?.commitment || "confirmed",
    filters
  );

  // Return cleanup function
  return () => {
    connection.removeProgramAccountChangeListener(subscriptionId);
  };
}

/**
 * Debounced subscription wrapper
 *
 * Adds debouncing to prevent excessive cache updates when account changes rapidly.
 * Useful for high-frequency updates or when multiple related accounts change together.
 *
 * @param callback - Original callback function
 * @param delayMs - Debounce delay in milliseconds (default: 50ms)
 * @returns Debounced callback function
 *
 * @example
 * ```typescript
 * const debouncedCallback = debounceCallback(
 *   (accountInfo) => updateCache(accountInfo),
 *   100 // wait 100ms before updating
 * );
 *
 * onPdaChange(connection, vaultPda, debouncedCallback);
 * ```
 */
export function debounceCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number = 50
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delayMs);
  }) as T;
}
