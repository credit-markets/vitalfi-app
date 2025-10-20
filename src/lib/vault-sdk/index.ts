/**
 * VitalFi Vault SDK
 *
 * Public API for interacting with the VitalFi Vault Solana program.
 *
 * @example
 * ```typescript
 * import { VaultClient, getVaultPda } from '@/lib/vault-sdk';
 *
 * const client = new VaultClient(program);
 * const vault = await client.getVault(vaultId);
 * ```
 */

// Constants
export * from "./constants";

// Types
export * from "./types";

// PDA Helpers
export * from "./pdas";

// Fetchers
export * from "./fetchers";

// Client
export * from "./client";

// Configuration
export * from "./config";

// Transactions
export * from "./transactions";
