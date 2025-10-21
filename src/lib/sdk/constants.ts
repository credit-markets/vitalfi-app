import { PublicKey } from "@solana/web3.js";

/**
 * VitalFi Vault Program Constants
 *
 * These constants define the program ID and other fixed values
 * used throughout the SDK.
 */

// Program ID for VitalFi Vault (same across all clusters for now)
export const VITALFI_VAULT_PROGRAM_ID = new PublicKey(
  "146hbPFqGb9a3v3t1BtkmftNeSNqXzoydzVPk95YtJNj"
);

// PDA seed constants (must match the program)
export const VAULT_SEED = "vault";
export const VAULT_TOKEN_SEED = "vault_token";
export const POSITION_SEED = "position";

// Maximum dust amount allowed in vault when closing (1000 smallest units)
export const MAX_DUST_AMOUNT = 1000;

// Maximum vault capacity to prevent overflow
// u64::MAX / 3 = 6148914691236517205
export const MAX_VAULT_CAP = 6148914691236517205n;
