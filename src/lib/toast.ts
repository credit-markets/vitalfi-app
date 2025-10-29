import { toast as sonnerToast } from "sonner";

/**
 * Get the current Solana network cluster for explorer links
 */
function getCurrentNetwork(): string {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
    "https://api.devnet.solana.com";

  if (endpoint.includes("mainnet")) return "mainnet-beta";
  if (endpoint.includes("testnet")) return "testnet";
  return "devnet";
}

/**
 * Get Solana Explorer URL for a transaction
 */
function getExplorerUrl(signature: string): string {
  const cluster = getCurrentNetwork();
  return `https://explorer.solana.com/tx/${signature}${
    cluster !== "mainnet-beta" ? `?cluster=${cluster}` : ""
  }`;
}

/**
 * Truncate a transaction signature for display
 */
function truncateSignature(signature: string, length = 8): string {
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

// ============================================================================
// Transaction Toasts
// ============================================================================

interface TransactionToastOptions {
  /** Unique ID for the toast (allows updating in place) */
  id?: string;
  /** Additional description text */
  description?: string;
}

/**
 * Show a loading toast for a pending transaction
 */
export function transactionLoading(
  message: string,
  options?: TransactionToastOptions
) {
  return sonnerToast.loading(message, {
    id: options?.id,
    description: options?.description,
  });
}

/**
 * Show a success toast with transaction link
 */
export function transactionSuccess(
  signature: string,
  message: string = "Transaction successful!",
  options?: TransactionToastOptions
) {
  const explorerUrl = getExplorerUrl(signature);

  return sonnerToast.success(message, {
    id: options?.id,
    description: options?.description || `Signature: ${truncateSignature(signature)}`,
    action: {
      label: "View",
      onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer"),
    },
  });
}

/**
 * Show an error toast for a failed transaction
 */
export function transactionError(
  error: Error | string,
  message: string = "Transaction failed",
  options?: TransactionToastOptions
) {
  const errorMessage = error instanceof Error ? error.message : error;

  return sonnerToast.error(message, {
    id: options?.id,
    description: options?.description || errorMessage || "Please try again.",
  });
}

// ============================================================================
// Clipboard Toasts
// ============================================================================

/**
 * Copy text to clipboard and show success toast
 */
export async function copyToClipboard(
  text: string,
  label: string = "Text"
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    sonnerToast.success(`${label} copied to clipboard`);
  } catch {
    sonnerToast.error("Failed to copy to clipboard");
  }
}

/**
 * Copy transaction signature to clipboard
 */
export async function copyTransactionSignature(signature: string): Promise<void> {
  return copyToClipboard(signature, "Transaction signature");
}

/**
 * Copy address to clipboard
 */
export async function copyAddress(address: string, label?: string): Promise<void> {
  return copyToClipboard(address, label || "Address");
}

// ============================================================================
// Standard Operation Toasts
// ============================================================================

/**
 * Show a success toast for export operations
 */
export function exportSuccess(format: string = "CSV") {
  return sonnerToast.success(`Data exported to ${format}`);
}

/**
 * Show an error toast with optional description
 */
export function errorToast(
  message: string,
  description?: string
) {
  return sonnerToast.error(message, {
    description: description || "Please try again or contact support if the issue persists.",
  });
}

/**
 * Show a success toast
 */
export function successToast(message: string, description?: string) {
  return sonnerToast.success(message, {
    description,
  });
}

/**
 * Show an info toast
 */
export function infoToast(message: string, description?: string) {
  return sonnerToast.info(message, {
    description,
  });
}

/**
 * Show a warning toast
 */
export function warningToast(message: string, description?: string) {
  return sonnerToast.warning(message, {
    description,
  });
}

// ============================================================================
// Validation Error Toasts
// ============================================================================

/**
 * Show a validation error toast
 */
export function validationError(message: string) {
  return sonnerToast.error(message);
}

/**
 * Show a wallet connection error
 */
export function walletConnectionError() {
  return validationError("Please connect your wallet");
}

// ============================================================================
// Vault-Specific Operation Toasts
// ============================================================================

/**
 * Deposit operation toasts
 */
export const deposit = {
  loading: (amount?: string) =>
    transactionLoading(
      "Processing deposit...",
      { id: "deposit", description: amount ? `Amount: ${amount}` : undefined }
    ),

  success: (signature: string, amount?: string) =>
    transactionSuccess(
      signature,
      "Deposit successful!",
      { id: "deposit", description: amount ? `Deposited: ${amount}` : undefined }
    ),

  error: (error: Error | string) =>
    transactionError(error, "Deposit failed", { id: "deposit" }),
};

/**
 * Claim operation toasts
 */
export const claim = {
  loading: (amount?: string) =>
    transactionLoading(
      "Processing claim...",
      { id: "claim", description: amount ? `Amount: ${amount}` : undefined }
    ),

  success: (signature: string, amount?: string) =>
    transactionSuccess(
      signature,
      "Claim successful!",
      { id: "claim", description: amount ? `Claimed: ${amount}` : undefined }
    ),

  error: (error: Error | string) =>
    transactionError(error, "Claim failed", { id: "claim" }),
};

/**
 * Vault initialization toasts
 */
export const vaultInit = {
  loading: () =>
    transactionLoading("Initializing vault...", { id: "vault-init" }),

  success: (signature: string, vaultId?: string) =>
    transactionSuccess(
      signature,
      "Vault initialized!",
      { id: "vault-init", description: vaultId ? `Vault ID: ${vaultId}` : undefined }
    ),

  error: (error: Error | string) =>
    transactionError(error, "Vault initialization failed", { id: "vault-init" }),
};

/**
 * Finalize funding toasts
 */
export const finalizeFunding = {
  loading: () =>
    transactionLoading("Finalizing funding...", { id: "finalize-funding" }),

  success: (signature: string) =>
    transactionSuccess(signature, "Funding finalized!", { id: "finalize-funding" }),

  error: (error: Error | string) =>
    transactionError(error, "Funding finalization failed", { id: "finalize-funding" }),
};

/**
 * Mature vault toasts
 */
export const matureVault = {
  loading: () =>
    transactionLoading("Maturing vault...", { id: "mature-vault" }),

  success: (signature: string) =>
    transactionSuccess(signature, "Vault matured!", { id: "mature-vault" }),

  error: (error: Error | string) =>
    transactionError(error, "Vault maturation failed", { id: "mature-vault" }),
};

/**
 * Close vault toasts
 */
export const closeVault = {
  loading: () =>
    transactionLoading("Closing vault...", { id: "close-vault" }),

  success: (signature: string) =>
    transactionSuccess(signature, "Vault closed!", { id: "close-vault" }),

  error: (error: Error | string) =>
    transactionError(error, "Vault closure failed", { id: "close-vault" }),
};

/**
 * Swap operation toasts
 */
export const swap = {
  loading: (amount: number, fromToken: string, toToken: string) =>
    transactionLoading(
      "Processing swap...",
      {
        id: "swap",
        description: `Swapping ${amount} ${fromToken} to ${toToken}`
      }
    ),

  success: (
    signature: string,
    inputAmount: number,
    inputToken: string,
    outputAmount: number,
    outputToken: string
  ) =>
    transactionSuccess(
      signature,
      "Swap successful!",
      {
        id: "swap",
        description: `${inputAmount} ${inputToken} → ${outputAmount.toFixed(4)} ${outputToken}`,
      }
    ),

  error: (error: Error | string) =>
    transactionError(error, "Swap failed", { id: "swap" }),
};

// ============================================================================
// Re-export base toast for custom usage
// ============================================================================

export { sonnerToast as toast };

/**
 * Dismiss a toast by ID
 */
export function dismiss(toastId: string | number) {
  return sonnerToast.dismiss(toastId);
}
