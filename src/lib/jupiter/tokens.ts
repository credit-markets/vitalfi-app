/**
 * Popular tokens for quick selection
 * Mainnet token addresses
 */

import type { JupiterToken } from "./types";

export const POPULAR_TOKENS: JupiterToken[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    chainId: 101,
    decimals: 9,
    name: "Wrapped SOL",
    symbol: "SOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["wrapped", "verified"],
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chainId: 101,
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["stablecoin", "verified"],
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    chainId: 101,
    decimals: 6,
    name: "USDT",
    symbol: "USDT",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    tags: ["stablecoin", "verified"],
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    chainId: 101,
    decimals: 5,
    name: "Bonk",
    symbol: "BONK",
    logoURI:
      "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
    tags: ["community", "verified"],
  },
  {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    chainId: 101,
    decimals: 6,
    name: "Jupiter",
    symbol: "JUP",
    logoURI:
      "https://static.jup.ag/jup/icon.png",
    tags: ["verified"],
  },
  {
    address: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    chainId: 101,
    decimals: 8,
    name: "Wrapped Ethereum (Wormhole)",
    symbol: "ETH",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
    tags: ["wrapped", "wormhole", "verified"],
  },
  {
    address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    chainId: 101,
    decimals: 9,
    name: "Marinade staked SOL",
    symbol: "mSOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
    tags: ["lst", "verified"],
  },
  {
    address: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    chainId: 101,
    decimals: 9,
    name: "Jito Staked SOL",
    symbol: "jitoSOL",
    logoURI:
      "https://storage.googleapis.com/token-metadata/JitoSOL-256.png",
    tags: ["lst", "verified"],
  },
];

// Target token for all swaps
export const USDT_MAINNET = POPULAR_TOKENS[2];

/**
 * Get token by mint address from popular tokens list
 */
export function getTokenByMint(mint: string): JupiterToken | undefined {
  return POPULAR_TOKENS.find((t) => t.address === mint);
}

/**
 * Check if token is USDT (no swap needed)
 */
export function isUSDT(mint: string): boolean {
  return mint === USDT_MAINNET.address;
}
