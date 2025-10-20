/**
 * Account Layout Constants
 *
 * Provides offsets and sizes for account fields to enable efficient
 * filtering via getProgramAccounts memcmp filters.
 *
 * **WHY THIS EXISTS**:
 * While Anchor's `program.account.vault.all([filters])` automatically handles
 * discriminators, we need explicit field offsets for memcmp filtering by
 * authority, owner, etc. These offsets are calculated from the Borsh serialization
 * layout defined in the program IDL.
 *
 * **Source**: @pollum-io/vitalfi-programs@0.1.4 IDL
 * **Validation**: Tests verify these match actual on-chain account structure
 */

import { PublicKey } from "@solana/web3.js";
import type { MemcmpFilter } from "@solana/web3.js";

/**
 * Vault Account Layout
 *
 * Borsh-serialized layout (200 bytes total):
 * - discriminator (8) + version (2) + authority (32) + vault_id (8) +
 *   asset_mint (32) + vault_token (32) + cap (8) + target_apy_bps (4) +
 *   funding_end_ts (8) + maturity_ts (8) + min_deposit (8) + status (1) +
 *   total_deposited (8) + total_claimed (8) + payout_num (16) +
 *   payout_den (16) + bump (1) = 200 bytes
 */
export const VaultLayout = {
  /** Total account size (from Anchor BorshAccountsCoder) */
  size: 200,

  /** Commonly used field offsets for memcmp filters */
  authorityOffset: 10, // After discriminator (8) + version (2)
  vaultIdOffset: 42, // After authority (32)
} as const;

/**
 * Position Account Layout
 *
 * Borsh-serialized layout (89 bytes total):
 * - discriminator (8) + vault (32) + owner (32) + deposited (8) +
 *   claimed (8) + bump (1) = 89 bytes
 */
export const PositionLayout = {
  /** Total account size (from Anchor BorshAccountsCoder) */
  size: 89,

  /** Commonly used field offsets for memcmp filters */
  vaultOffset: 8, // After discriminator (8)
  ownerOffset: 40, // After vault (32)
} as const;

/**
 * Create memcmp filter for vault authority
 *
 * @param authority - Authority public key to filter by
 * @returns Memcmp filter for use with program.account.vault.all() or getProgramAccounts
 *
 * @example
 * ```typescript
 * const filters = [memcmpFilterAuthority(authorityPubkey)];
 * const vaults = await program.account.vault.all(filters);
 * ```
 */
export function memcmpFilterAuthority(authority: PublicKey): MemcmpFilter {
  return {
    memcmp: {
      offset: VaultLayout.authorityOffset,
      bytes: authority.toBase58(),
    },
  };
}

/**
 * Create memcmp filter for position owner
 *
 * @param owner - Owner public key to filter by
 * @returns Memcmp filter for use with program.account.position.all() or getProgramAccounts
 *
 * @example
 * ```typescript
 * const filters = [memcmpFilterOwner(userPubkey)];
 * const positions = await program.account.position.all(filters);
 * ```
 */
export function memcmpFilterOwner(owner: PublicKey): MemcmpFilter {
  return {
    memcmp: {
      offset: PositionLayout.ownerOffset,
      bytes: owner.toBase58(),
    },
  };
}
