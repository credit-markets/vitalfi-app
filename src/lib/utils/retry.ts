/**
 * Transaction Retry Logic
 *
 * Implements exponential backoff retry strategy for failed Solana transactions.
 * Handles transient errors (network, RPC) while avoiding retrying non-retryable errors.
 */

import { trackWarning } from "@/lib/error-tracking";
import { classifySolanaError, SolanaErrorType } from "@/lib/error-tracking";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: auto-detect) */
  isRetryable?: (error: Error) => boolean;
  /** Callback when retry is attempted */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  isRetryable: isDefaultRetryable,
  onRetry: () => {},
};

/**
 * Determine if a Solana error is retryable
 */
function isDefaultRetryable(error: Error): boolean {
  const errorType = classifySolanaError(error);

  // Retryable errors (transient)
  const retryableTypes = [
    SolanaErrorType.TIMEOUT,
    SolanaErrorType.RPC_ERROR,
    SolanaErrorType.NETWORK_ERROR,
  ];

  // Non-retryable errors (user action required or permanent failure)
  const nonRetryableTypes = [
    SolanaErrorType.INSUFFICIENT_FUNDS,
    SolanaErrorType.SIMULATION_ERROR,
    SolanaErrorType.PROGRAM_ERROR,
  ];

  if (retryableTypes.includes(errorType)) {
    return true;
  }

  if (nonRetryableTypes.includes(errorType)) {
    return false;
  }

  // Unknown errors: retry cautiously
  return errorType === SolanaErrorType.UNKNOWN;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => connection.getAccountInfo(pubkey),
 *   { maxAttempts: 5 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!opts.isRetryable(lastError)) {
        throw lastError; // Don't retry non-retryable errors
      }

      // If this was the last attempt, throw
      if (attempt === opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay and notify
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      trackWarning("Retrying failed operation", {
        attempt,
        maxAttempts: opts.maxAttempts,
        delay,
        error: lastError.message,
      });

      opts.onRetry(attempt, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry wrapper specifically for transactions
 *
 * @param fn - Transaction function
 * @param txName - Name of transaction (for logging)
 * @param options - Retry options
 *
 * @example
 * ```typescript
 * const signature = await retryTransaction(
 *   () => client.deposit(vaultId, authority, amount, mint),
 *   "deposit",
 *   { maxAttempts: 5 }
 * );
 * ```
 */
export async function retryTransaction<T>(
  fn: () => Promise<T>,
  txName: string,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    onRetry: (attempt, error) => {
      console.log(
        `[Retry] Transaction "${txName}" failed (attempt ${attempt}/${
          options.maxAttempts || 3
        }): ${error.message}`
      );
      options.onRetry?.(attempt, error);
    },
  });
}

/**
 * Retry wrapper for RPC calls
 *
 * @param fn - RPC function
 * @param methodName - RPC method name (for logging)
 * @param options - Retry options
 *
 * @example
 * ```typescript
 * const accountInfo = await retryRpcCall(
 *   () => connection.getAccountInfo(pubkey),
 *   "getAccountInfo"
 * );
 * ```
 */
export async function retryRpcCall<T>(
  fn: () => Promise<T>,
  methodName: string,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 5, // RPC calls can retry more
    initialDelay: 500, // Faster initial retry
    ...options,
    onRetry: (attempt, error) => {
      console.log(
        `[Retry] RPC "${methodName}" failed (attempt ${attempt}/${
          options.maxAttempts || 5
        }): ${error.message}`
      );
      options.onRetry?.(attempt, error);
    },
  });
}
