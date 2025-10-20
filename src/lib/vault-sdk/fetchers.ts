import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import type { VitalfiVault, VaultAccount, PositionAccount } from "./types";
import { getVaultPda, getPositionPda } from "./pdas";
import { memcmpFilterAuthority, memcmpFilterOwner } from "./layout";

/**
 * Account Fetchers
 *
 * Functions to fetch and decode on-chain account data.
 * These are low-level utilities used by the VaultClient.
 */

/**
 * Fetch a single vault account by ID
 *
 * @param program - Anchor program instance
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @returns Vault account data or null if not found
 */
export async function fetchVault(
  program: Program<VitalfiVault>,
  authority: PublicKey,
  vaultId: BN
): Promise<VaultAccount | null> {
  try {
    const [vaultPda] = getVaultPda(authority, vaultId);
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    return vaultAccount;
  } catch (error) {
    // Account not found or doesn't exist
    console.warn(`Vault not found: ${vaultId.toString()}`, error);
    return null;
  }
}

/**
 * Fetch a vault account by PDA
 *
 * @param program - Anchor program instance
 * @param vaultPda - Vault PDA public key
 * @returns Vault account data or null if not found
 */
export async function fetchVaultByPda(
  program: Program<VitalfiVault>,
  vaultPda: PublicKey
): Promise<VaultAccount | null> {
  try {
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    return vaultAccount;
  } catch (error) {
    console.warn(`Vault not found at PDA: ${vaultPda.toBase58()}`, error);
    return null;
  }
}

/**
 * Fetch all vaults for a given authority
 *
 * @param program - Anchor program instance
 * @param authority - Vault authority public key
 * @returns Array of vault accounts with their PDAs
 */
export async function fetchAllVaultsByAuthority(
  program: Program<VitalfiVault>,
  authority: PublicKey
): Promise<Array<{ pubkey: PublicKey; account: VaultAccount }>> {
  try {
    const vaults = await program.account.vault.all([
      memcmpFilterAuthority(authority),
    ]);
    return vaults.map((v) => ({
      pubkey: v.publicKey,
      account: v.account,
    }));
  } catch (error) {
    console.error("Error fetching vaults:", error);
    return [];
  }
}

/**
 * Fetch all vaults (no filter)
 *
 * WARNING: This can be expensive on mainnet. Consider pagination.
 *
 * @param program - Anchor program instance
 * @returns Array of all vault accounts with their PDAs
 */
export async function fetchAllVaults(
  program: Program<VitalfiVault>
): Promise<Array<{ pubkey: PublicKey; account: VaultAccount }>> {
  try {
    const vaults = await program.account.vault.all();
    return vaults.map((v) => ({
      pubkey: v.publicKey,
      account: v.account,
    }));
  } catch (error) {
    console.error("Error fetching all vaults:", error);
    return [];
  }
}

/**
 * Fetch a user's position in a vault
 *
 * @param program - Anchor program instance
 * @param vaultPda - Vault PDA public key
 * @param user - User wallet public key
 * @returns Position account data or null if not found
 */
export async function fetchPosition(
  program: Program<VitalfiVault>,
  vaultPda: PublicKey,
  user: PublicKey
): Promise<PositionAccount | null> {
  try {
    const [positionPda] = getPositionPda(vaultPda, user);
    const positionAccount = await program.account.position.fetch(positionPda);
    return positionAccount;
  } catch {
    // Position not found (user hasn't deposited)
    return null;
  }
}

/**
 * Fetch all positions for a given user across all vaults
 *
 * @param program - Anchor program instance
 * @param user - User wallet public key
 * @returns Array of position accounts with their PDAs and vault keys
 */
export async function fetchAllPositionsByUser(
  program: Program<VitalfiVault>,
  user: PublicKey
): Promise<Array<{ pubkey: PublicKey; account: PositionAccount }>> {
  try {
    const positions = await program.account.position.all([
      memcmpFilterOwner(user),
    ]);
    return positions.map((p) => ({
      pubkey: p.publicKey,
      account: p.account,
    }));
  } catch (error) {
    console.error("Error fetching user positions:", error);
    return [];
  }
}

/**
 * Check if a vault account exists
 *
 * @param program - Anchor program instance
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @returns true if vault exists
 */
export async function vaultExists(
  program: Program<VitalfiVault>,
  authority: PublicKey,
  vaultId: BN
): Promise<boolean> {
  const vault = await fetchVault(program, authority, vaultId);
  return vault !== null;
}

/**
 * Check if a position exists
 *
 * @param program - Anchor program instance
 * @param vaultPda - Vault PDA public key
 * @param user - User wallet public key
 * @returns true if position exists
 */
export async function positionExists(
  program: Program<VitalfiVault>,
  vaultPda: PublicKey,
  user: PublicKey
): Promise<boolean> {
  const position = await fetchPosition(program, vaultPda, user);
  return position !== null;
}
