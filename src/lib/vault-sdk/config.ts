/**
 * Vault Configuration
 *
 * Centralized configuration for vault authorities, IDs, and network-specific settings.
 */

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Native SOL mint (wrapped SOL)
export const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// USDC mint addresses
export const USDC_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export interface VaultConfig {
  id: BN;
  name: string;
  description: string;
  assetMint: PublicKey;
  assetSymbol: string;
}

export interface NetworkConfig {
  authority: PublicKey;
  vaults: VaultConfig[];
  rpcEndpoint?: string;
}

/**
 * Vault configurations by network
 */
export const VAULT_CONFIG: Record<string, NetworkConfig> = {
  devnet: {
    // TODO: Replace with actual devnet authority once vault is deployed
    authority: new PublicKey("11111111111111111111111111111111"),
    vaults: [
      {
        id: new BN(1),
        name: "Medical Receivables Vault #1",
        description: "Q1 2025 Medical Receivables - 12% APY",
        assetMint: NATIVE_SOL_MINT,
        assetSymbol: "SOL",
      },
    ],
    rpcEndpoint: "https://api.devnet.solana.com",
  },
  "mainnet-beta": {
    // TODO: Replace with actual mainnet authority
    authority: new PublicKey("11111111111111111111111111111111"),
    vaults: [],
    rpcEndpoint: "https://api.mainnet-beta.solana.com",
  },
  localnet: {
    // For local testing with anchor localnet
    authority: new PublicKey("11111111111111111111111111111111"),
    vaults: [
      {
        id: new BN(1),
        name: "Test Vault",
        description: "Local testing vault",
        assetMint: NATIVE_SOL_MINT,
        assetSymbol: "SOL",
      },
    ],
    rpcEndpoint: "http://localhost:8899",
  },
};

/**
 * Get current network from environment
 */
export function getCurrentNetwork(): string {
  return process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network?: string): NetworkConfig {
  const net = network || getCurrentNetwork();
  const config = VAULT_CONFIG[net];

  if (!config) {
    throw new Error(`No configuration found for network: ${net}`);
  }

  return config;
}

/**
 * Get default vault for current network
 */
export function getDefaultVault(network?: string): VaultConfig {
  const config = getNetworkConfig(network);

  if (config.vaults.length === 0) {
    throw new Error(`No vaults configured for network: ${network || getCurrentNetwork()}`);
  }

  return config.vaults[0];
}

/**
 * Get vault by ID
 */
export function getVaultById(vaultId: BN, network?: string): VaultConfig | undefined {
  const config = getNetworkConfig(network);
  return config.vaults.find((v) => v.id.eq(vaultId));
}

/**
 * Get all vaults for current network
 */
export function getAllVaults(network?: string): VaultConfig[] {
  const config = getNetworkConfig(network);
  return config.vaults;
}
