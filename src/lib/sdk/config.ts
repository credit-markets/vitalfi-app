/**
 * Token Configuration
 *
 * Centralized configuration for token mints and decimals.
 */

import { PublicKey } from "@solana/web3.js";
import { env } from "@/lib/env";
import { DEFAULT_DECIMALS } from "@/lib/constants";

// Token mint addresses
export const TOKEN_MINTS = {
  SOL: new PublicKey("So11111111111111111111111111111111111111112"),
  USDC: {
    DEVNET: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    MAINNET: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  },
} as const;

// Token decimals configuration
export const TOKEN_DECIMALS: Record<string, number> = {
  [TOKEN_MINTS.SOL.toBase58()]: 9,
  [TOKEN_MINTS.USDC.DEVNET.toBase58()]: 6,
  [TOKEN_MINTS.USDC.MAINNET.toBase58()]: 6,
};

/**
 * Get the current Solana network from environment
 */
export function getCurrentNetwork(): string {
  return env.solanaNetwork;
}

/**
 * Get token decimals for a given mint address
 * Falls back to DEFAULT_DECIMALS if mint is not found
 */
export function getTokenDecimals(mint: string | PublicKey): number {
  const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
  return TOKEN_DECIMALS[mintStr] || DEFAULT_DECIMALS;
}
