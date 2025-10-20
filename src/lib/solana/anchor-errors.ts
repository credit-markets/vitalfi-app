/**
 * Anchor Program Error Parsing
 *
 * Maps Anchor error codes to user-friendly messages.
 * Error codes are extracted from the VitalFi Vault IDL.
 */

/**
 * Anchor error map from VitalFi Vault program
 * Source: @pollum-io/vitalfi-programs/target/idl/vitalfi_vault.json
 */
export const ANCHOR_ERROR_MAP: Record<number, string> = {
  6000: "Invalid mint provided",
  6001: "Vault program is paused",
  6002: "Invalid vault status for this operation",
  6003: "Funding period has not ended yet",
  6004: "Funding period has ended",
  6005: "Insufficient funds",
  6006: "Deposit would exceed vault capacity",
  6007: "Deposit amount below minimum",
  6008: "Vault has not matured yet",
  6009: "Vault is already matured",
  6010: "Only vault authority can perform this action",
  6011: "Cannot close vault with remaining funds",
  6012: "Invalid timestamp configuration",
  6013: "Deposit amount must be greater than zero",
  6014: "Arithmetic overflow",
  6015: "No funds to claim",
  6016: "Funding threshold not met (< 2/3 cap)",
  6017: "Total deposited cannot be zero",
  6018: "Vault capacity must be greater than zero",
  6019: "Minimum deposit must be greater than zero and less than or equal to cap",
};

/**
 * Anchor error name to code mapping (for reverse lookup)
 */
export const ANCHOR_ERROR_NAME_MAP: Record<string, number> = {
  InvalidMint: 6000,
  VaultPaused: 6001,
  InvalidStatus: 6002,
  FundingNotEnded: 6003,
  FundingEnded: 6004,
  InsufficientFunds: 6005,
  CapExceeded: 6006,
  BelowMinDeposit: 6007,
  NotMatured: 6008,
  AlreadyMatured: 6009,
  UnauthorizedAuthority: 6010,
  CannotCloseWithFunds: 6011,
  InvalidTimestamps: 6012,
  ZeroDeposit: 6013,
  ArithmeticOverflow: 6014,
  NothingToClaim: 6015,
  FundingThresholdNotMet: 6016,
  ZeroTotalDeposited: 6017,
  InvalidCapacity: 6018,
  InvalidMinDeposit: 6019,
};

/**
 * Parse Anchor error from error message
 *
 * Anchor errors typically appear as:
 * - "custom program error: 0x1771" (hex format)
 * - "Error Code: InvalidStatus" (name format)
 * - "Error Number: 6002" (decimal format)
 *
 * @param error - Error object or message
 * @returns User-friendly error message or null if not an Anchor error
 *
 * @example
 * ```typescript
 * const error = new Error("custom program error: 0x1771");
 * const parsed = parseAnchorError(error);
 * // parsed = "Invalid vault status for this operation"
 * ```
 */
export function parseAnchorError(error: Error | string): string | null {
  const message = typeof error === "string" ? error : error.message;

  // Pattern 1: Hex format - "custom program error: 0x1771"
  const hexMatch = message.match(/custom program error: 0x([0-9a-fA-F]+)/);
  if (hexMatch) {
    const errorCode = parseInt(hexMatch[1], 16);
    return ANCHOR_ERROR_MAP[errorCode] || null;
  }

  // Pattern 2: Decimal format - "Error Number: 6002"
  const decimalMatch = message.match(/Error Number: (\d+)/);
  if (decimalMatch) {
    const errorCode = parseInt(decimalMatch[1], 10);
    return ANCHOR_ERROR_MAP[errorCode] || null;
  }

  // Pattern 3: Name format - "Error Code: InvalidStatus"
  const nameMatch = message.match(/Error Code: (\w+)/);
  if (nameMatch) {
    const errorName = nameMatch[1];
    const errorCode = ANCHOR_ERROR_NAME_MAP[errorName];
    if (errorCode !== undefined) {
      return ANCHOR_ERROR_MAP[errorCode] || null;
    }
  }

  // Pattern 4: Direct error code in message - "0x1771" or "6002"
  const directHexMatch = message.match(/0x([0-9a-fA-F]{4})/);
  if (directHexMatch) {
    const errorCode = parseInt(directHexMatch[1], 16);
    return ANCHOR_ERROR_MAP[errorCode] || null;
  }

  // Pattern 5: AnchorError format - looks for error code in various formats
  const anchorErrorMatch = message.match(/AnchorError.*?(\d{4})/);
  if (anchorErrorMatch) {
    const errorCode = parseInt(anchorErrorMatch[1], 10);
    if (errorCode >= 6000 && errorCode <= 6999) {
      return ANCHOR_ERROR_MAP[errorCode] || null;
    }
  }

  return null;
}

/**
 * Get error code from Anchor error
 *
 * @param error - Error object or message
 * @returns Error code number or null
 */
export function getAnchorErrorCode(error: Error | string): number | null {
  const message = typeof error === "string" ? error : error.message;

  // Try hex format
  const hexMatch = message.match(/0x([0-9a-fA-F]+)/);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    if (code >= 6000 && code <= 6999) {
      return code;
    }
  }

  // Try decimal format
  const decimalMatch = message.match(/(\d{4})/);
  if (decimalMatch) {
    const code = parseInt(decimalMatch[1], 10);
    if (code >= 6000 && code <= 6999) {
      return code;
    }
  }

  // Try name format
  const nameMatch = message.match(/Error Code: (\w+)/);
  if (nameMatch) {
    const errorName = nameMatch[1];
    return ANCHOR_ERROR_NAME_MAP[errorName] || null;
  }

  return null;
}

/**
 * Check if error is a specific Anchor error
 *
 * @example
 * ```typescript
 * if (isAnchorError(error, "FundingEnded")) {
 *   console.log("Vault funding period has ended");
 * }
 * ```
 */
export function isAnchorError(error: Error | string, errorName: keyof typeof ANCHOR_ERROR_NAME_MAP): boolean {
  const code = getAnchorErrorCode(error);
  return code === ANCHOR_ERROR_NAME_MAP[errorName];
}
