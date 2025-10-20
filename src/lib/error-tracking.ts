/**
 * Error Tracking & Monitoring
 *
 * Production-ready error tracking with optional Sentry integration.
 * Includes Solana-specific error classification, Anchor error parsing, and RPC error handling.
 *
 * To enable Sentry:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 * 3. Uncomment Sentry imports and initialization
 */

// import * as Sentry from "@sentry/nextjs";
import { parseAnchorError } from "@/lib/solana/anchor-errors";

export interface ErrorContext {
  [key: string]: unknown;
  user?: string;
  transaction?: string;
  vault?: string;
  network?: string;
}

export enum ErrorSeverity {
  Fatal = "fatal",
  Error = "error",
  Warning = "warning",
  Info = "info",
}

/**
 * Solana-specific error types for better categorization
 */
export enum SolanaErrorType {
  RPC_ERROR = "rpc_error",
  TRANSACTION_FAILED = "transaction_failed",
  INSUFFICIENT_FUNDS = "insufficient_funds",
  PROGRAM_ERROR = "program_error",
  SIMULATION_ERROR = "simulation_error",
  TIMEOUT = "timeout",
  NETWORK_ERROR = "network_error",
  UNKNOWN = "unknown",
}

/**
 * Classify Solana errors for better tracking
 */
export function classifySolanaError(error: Error): SolanaErrorType {
  const message = error.message.toLowerCase();

  if (message.includes("insufficient funds") || message.includes("insufficient lamports")) {
    return SolanaErrorType.INSUFFICIENT_FUNDS;
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return SolanaErrorType.TIMEOUT;
  }
  if (message.includes("simulation failed") || message.includes("simulate")) {
    return SolanaErrorType.SIMULATION_ERROR;
  }
  if (message.includes("program") || message.includes("instruction")) {
    return SolanaErrorType.PROGRAM_ERROR;
  }
  if (message.includes("rpc") || message.includes("fetch")) {
    return SolanaErrorType.RPC_ERROR;
  }
  if (message.includes("network") || message.includes("connection")) {
    return SolanaErrorType.NETWORK_ERROR;
  }
  if (message.includes("transaction") || message.includes("failed to send")) {
    return SolanaErrorType.TRANSACTION_FAILED;
  }

  return SolanaErrorType.UNKNOWN;
}

/**
 * Initialize error tracking (call once at app startup)
 */
export function initErrorTracking(): void {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (sentryDsn && typeof window !== "undefined") {
    // Sentry initialization (uncomment when ready)
    // Sentry.init({
    //   dsn: sentryDsn,
    //   environment: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    //   tracesSampleRate: 0.1,
    //   beforeSend(event, hint) {
    //     // Filter out localhost errors in production
    //     if (event.request?.url?.includes("localhost")) {
    //       return null;
    //     }
    //     return event;
    //   },
    // });
    console.log("[Error Tracking] Initialized (Sentry disabled, set NEXT_PUBLIC_SENTRY_DSN to enable)");
  } else {
    console.log("[Error Tracking] Running without Sentry");
  }
}

/**
 * Track errors with Solana-specific context
 */
export function trackError(
  error: Error,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.Error
): void {
  // Classify Solana errors
  const errorType = classifySolanaError(error);
  const enhancedContext = {
    ...context,
    errorType,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "production") {
    // Send to Sentry if configured
    // if (typeof Sentry !== "undefined") {
    //   Sentry.captureException(error, {
    //     level: severity,
    //     extra: enhancedContext,
    //     tags: {
    //       errorType,
    //       network: context?.network || "unknown",
    //     },
    //   });
    // }

    // Always log to console in production for debugging
    console.error(`[Error Tracking] ${severity.toUpperCase()}:`, error.message);
    if (enhancedContext) {
      console.error("[Context]:", enhancedContext);
    }
  } else {
    // Development: verbose logging
    console.error(`[DEV ${severity.toUpperCase()}]`, error);
    console.error("[Type]:", errorType);
    if (enhancedContext) {
      console.error("[Context]:", enhancedContext);
    }
  }
}

/**
 * Track warnings
 */
export function trackWarning(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "production") {
    // if (typeof Sentry !== "undefined") {
    //   Sentry.captureMessage(message, {
    //     level: "warning",
    //     extra: context,
    //   });
    // }
    console.warn("[Warning]:", message, context);
  } else {
    console.warn("[DEV Warning]:", message);
    if (context) {
      console.warn("[Context]:", context);
    }
  }
}

/**
 * Track transaction errors with specific handling
 */
export function trackTransactionError(
  error: Error,
  context: {
    signature?: string;
    vault?: string;
    user?: string;
    operation: "deposit" | "claim" | "initialize" | "finalize" | "mature" | "close";
  }
): void {
  const errorType = classifySolanaError(error);

  trackError(error, {
    ...context,
    category: "transaction",
    errorType,
  });

  // Log user-friendly message based on error type
  if (errorType === SolanaErrorType.INSUFFICIENT_FUNDS) {
    console.warn("User has insufficient funds for this transaction");
  } else if (errorType === SolanaErrorType.TIMEOUT) {
    console.warn("Transaction timed out - may still be processing");
  } else if (errorType === SolanaErrorType.SIMULATION_ERROR) {
    console.warn("Transaction simulation failed - check program state");
  }
}

/**
 * Track RPC errors specifically
 */
export function trackRpcError(
  error: Error,
  context: {
    endpoint?: string;
    method?: string;
    params?: unknown;
  }
): void {
  trackError(error, {
    ...context,
    category: "rpc",
  });
}

/**
 * Get user-friendly error message
 *
 * Tries to parse Anchor errors first, then falls back to general Solana error types.
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  // First, try to parse as Anchor error
  const anchorMessage = parseAnchorError(error);
  if (anchorMessage) {
    return anchorMessage;
  }

  // Fall back to general Solana error classification
  const errorType = classifySolanaError(error);

  switch (errorType) {
    case SolanaErrorType.INSUFFICIENT_FUNDS:
      return "Insufficient SOL balance. Please add funds to your wallet.";
    case SolanaErrorType.TIMEOUT:
      return "Transaction timed out. Please check your wallet or try again.";
    case SolanaErrorType.SIMULATION_ERROR:
      return "Transaction failed validation. Please check vault status.";
    case SolanaErrorType.PROGRAM_ERROR:
      return "Program error. Please contact support if this persists.";
    case SolanaErrorType.RPC_ERROR:
      return "Network error. Please check your connection and try again.";
    case SolanaErrorType.NETWORK_ERROR:
      return "Network connection issue. Please try again.";
    case SolanaErrorType.TRANSACTION_FAILED:
      return "Transaction failed. Please try again.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}
