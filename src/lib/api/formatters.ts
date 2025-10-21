/**
 * Decimals-aware formatters for API DTOs
 *
 * RESILIENCY PATCH: Support non-SOL tokens (USDC, etc.)
 * All amounts in DTOs are strings in token base units (lamports for SOL, smallest unit for USDC)
 */

/**
 * Convert string lamports/base units to decimal amount
 *
 * @param amount - Amount in smallest unit as string (e.g., "1000000000" for 1 SOL)
 * @param decimals - Token decimals (9 for SOL, 6 for USDC)
 * @returns Decimal amount as number
 */
export function fromBaseUnits(
  amount: string | null | undefined,
  decimals: number = 9
): number {
  if (!amount) return 0;
  try {
    const bigAmount = BigInt(amount);
    const divisor = BigInt(10 ** decimals);

    // Convert to number for final result
    const result = Number(bigAmount) / Number(divisor);

    // Check for precision loss (amounts exceeding MAX_SAFE_INTEGER)
    // Reconstruct the value and compare
    const reconstructed = BigInt(Math.floor(result * 10 ** decimals));
    if (reconstructed !== bigAmount) {
      console.warn(
        `Precision loss detected for amount: ${amount}. ` +
          `Original: ${bigAmount}, Reconstructed: ${reconstructed}. ` +
          `Consider using BigInt or Decimal library for this value.`
      );
    }

    return result;
  } catch (error) {
    console.error("Failed to parse base units:", amount, error);
    return 0;
  }
}

/**
 * Convert decimal amount to string lamports/base units
 *
 * @param amount - Decimal amount
 * @param decimals - Token decimals (9 for SOL, 6 for USDC)
 * @returns Amount in smallest unit as string
 */
export function toBaseUnits(amount: number, decimals: number = 9): string {
  // Convert to base units (e.g., SOL → lamports)
  const amountBigInt = BigInt(Math.floor(amount * 10 ** decimals));
  return amountBigInt.toString();
}

/**
 * Format timestamp string to Date with null safety
 *
 * RESILIENCY PATCH: UTC time handling with null guards
 *
 * @param timestamp - ISO 8601 string or Unix epoch string (seconds)
 * @returns Date object or null
 */
export function parseTimestamp(
  timestamp: string | null | undefined
): Date | null {
  if (!timestamp) return null;

  try {
    // Try parsing as ISO 8601 first
    if (timestamp.includes("T") || timestamp.includes("Z")) {
      return new Date(timestamp);
    }

    // Try parsing as Unix epoch (seconds)
    const epochSeconds = parseInt(timestamp, 10);
    if (!isNaN(epochSeconds)) {
      return new Date(epochSeconds * 1000);
    }

    return null;
  } catch (error) {
    console.error("Failed to parse timestamp:", timestamp, error);
    return null;
  }
}

/**
 * Format Date to ISO string with null safety
 *
 * @param date - Date object or null
 * @returns ISO 8601 string or empty string
 */
export function toISOString(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}
