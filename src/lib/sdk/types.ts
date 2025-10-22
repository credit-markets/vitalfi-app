/**
 * VitalFi Vault Program Types
 *
 * This file re-exports types from the generated program IDL and adds
 * convenience types for the SDK.
 */

// Import the IDL JSON and TypeScript types from the published package
import IDL_JSON from "@pollum-io/vitalfi-programs/idl";
import type { VitalfiVault } from "@pollum-io/vitalfi-programs/types";
import type { IdlAccounts } from "@coral-xyz/anchor";

// Export the IDL for use with Program constructor
export const VitalfiVaultIDL = IDL_JSON;

// Re-export the Program type
export type { VitalfiVault };

// Account types derived from the IDL
export type VaultAccount = IdlAccounts<VitalfiVault>["vault"];
export type PositionAccount = IdlAccounts<VitalfiVault>["position"];

// Vault status enum (matches the program)
export enum VaultStatus {
  Funding = "funding",
  Active = "active",
  Canceled = "canceled",
  Matured = "matured",
  Closed = "closed",
}

// Helper type for vault status from on-chain data
export type VaultStatusOnChain =
  | { funding: Record<string, never> }
  | { active: Record<string, never> }
  | { canceled: Record<string, never> }
  | { matured: Record<string, never> }
  | { closed: Record<string, never> };

/**
 * Convert on-chain vault status to enum
 */
export function getVaultStatus(status: VaultStatusOnChain): VaultStatus {
  if ("funding" in status) return VaultStatus.Funding;
  if ("active" in status) return VaultStatus.Active;
  if ("canceled" in status) return VaultStatus.Canceled;
  if ("matured" in status) return VaultStatus.Matured;
  if ("closed" in status) return VaultStatus.Closed;
  throw new Error("Unknown vault status");
}
