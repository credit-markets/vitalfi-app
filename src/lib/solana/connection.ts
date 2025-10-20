import { Connection, clusterApiUrl, Commitment, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { retryRpcCall } from "@/lib/utils/retry";

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK as "devnet" | "testnet" | "mainnet-beta");

export const DEFAULT_COMMITMENT: Commitment = "confirmed";

export function getSolanaConnection(commitment: Commitment = DEFAULT_COMMITMENT): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, commitment);
}

export const connection = getSolanaConnection();

/**
 * Fetch with retry for idempotent read operations
 *
 * Wraps an async function with exponential backoff retry logic.
 * Only use for read operations (NOT writes - those are not idempotent).
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param baseDelay - Initial delay in ms (default: 1000)
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const accountInfo = await fetchWithRetry(
 *   () => connection.getAccountInfo(pubkey)
 * );
 * ```
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return retryRpcCall(fn, "fetchWithRetry", {
    maxAttempts: maxRetries,
    initialDelay: baseDelay,
  });
}

/**
 * Get recent blockhash with retry and context
 *
 * This is a read operation so it's safe to retry.
 * Returns blockhash with expiry block height for transaction building.
 *
 * @param connection - Solana connection
 * @param commitment - Commitment level (default: "finalized" for safety)
 * @returns Blockhash with expiry block height
 *
 * @example
 * ```typescript
 * const { blockhash, lastValidBlockHeight } = await recentBlockhashWithContext(connection);
 * ```
 */
export async function recentBlockhashWithContext(
  connection: Connection,
  commitment: Commitment = "finalized"
): Promise<BlockhashWithExpiryBlockHeight> {
  return fetchWithRetry(
    () => connection.getLatestBlockhash(commitment),
    3,
    500
  );
}
