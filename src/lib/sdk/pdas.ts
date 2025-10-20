import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  VITALFI_VAULT_PROGRAM_ID,
  VAULT_SEED,
  VAULT_TOKEN_SEED,
  POSITION_SEED,
} from "./constants";

/**
 * PDA (Program Derived Address) Helpers
 *
 * These functions derive deterministic addresses for program accounts.
 * Seeds must match exactly with the on-chain program.
 */

/**
 * Derive Vault PDA
 *
 * Seeds: ["vault", authority, vault_id (u64 LE bytes)]
 *
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @returns [PublicKey, bump]
 */
export function getVaultPda(
  authority: PublicKey,
  vaultId: BN
): [PublicKey, number] {
  const vaultIdBytes = vaultId.toArrayLike(Buffer, "le", 8);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(VAULT_SEED),
      authority.toBuffer(),
      vaultIdBytes,
    ],
    VITALFI_VAULT_PROGRAM_ID
  );
}

/**
 * Derive Vault Token Account PDA
 *
 * Seeds: ["vault_token", vault]
 *
 * @param vault - Vault PDA public key
 * @returns [PublicKey, bump]
 */
export function getVaultTokenPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_TOKEN_SEED), vault.toBuffer()],
    VITALFI_VAULT_PROGRAM_ID
  );
}

/**
 * Derive Position PDA
 *
 * Seeds: ["position", vault, user]
 *
 * @param vault - Vault PDA public key
 * @param user - User wallet public key
 * @returns [PublicKey, bump]
 */
export function getPositionPda(
  vault: PublicKey,
  user: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POSITION_SEED), vault.toBuffer(), user.toBuffer()],
    VITALFI_VAULT_PROGRAM_ID
  );
}

/**
 * Batch derive all PDAs for a vault and user
 *
 * Useful when you need multiple PDAs at once for transactions.
 *
 * @param authority - Vault authority public key
 * @param vaultId - Vault ID as BN
 * @param user - Optional user public key
 * @returns Object with all PDAs
 */
export function getAllPdas(
  authority: PublicKey,
  vaultId: BN,
  user?: PublicKey
) {
  const [vault, vaultBump] = getVaultPda(authority, vaultId);
  const [vaultToken, vaultTokenBump] = getVaultTokenPda(vault);

  const result = {
    vault,
    vaultBump,
    vaultToken,
    vaultTokenBump,
    position: null as PublicKey | null,
    positionBump: null as number | null,
  };

  if (user) {
    const [position, positionBump] = getPositionPda(vault, user);
    result.position = position;
    result.positionBump = positionBump;
  }

  return result;
}
