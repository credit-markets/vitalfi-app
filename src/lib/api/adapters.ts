/**
 * Adapters for converting between backend DTOs and frontend types
 *
 * The backend uses string representations of all numeric values to avoid
 * JavaScript precision loss with Solana's u64 types. The frontend uses
 * BN (bn.js) and PublicKey types for Solana interactions.
 */

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type { VaultDTO, PositionDTO, ActivityDTO } from "./client";
import type { VaultAccount, PositionAccount, VaultStatusOnChain } from "@/lib/sdk";
import type { VaultEvent, EventTag } from "@/types/vault";

/**
 * Convert string status from backend to on-chain status format
 */
function stringToVaultStatus(status: string): VaultStatusOnChain {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'funding':
      return { funding: {} };
    case 'active':
      return { active: {} };
    case 'canceled':
      return { canceled: {} };
    case 'matured':
      return { matured: {} };
    case 'closed':
      return { closed: {} };
    default:
      throw new Error(`Unknown vault status: ${status}`);
  }
}

/**
 * Convert VaultDTO from backend to VaultAccount format used by frontend
 *
 * NOTE: This adapter needs to be updated to match the actual backend DTO fields.
 * For now, it's commented out until the full migration is complete.
 */
export function vaultDtoToAccount(dto: VaultDTO): {
  publicKey: PublicKey;
  account: Partial<VaultAccount>;
} {
  return {
    publicKey: new PublicKey(dto.vaultPda),
    account: {
      authority: new PublicKey(dto.authority),
      vaultId: new BN(dto.vaultId),
      // @ts-expect-error - Adapters need updating
      assetMint: dto.assetMint ? new PublicKey(dto.assetMint) : undefined as unknown as PublicKey | BN,
      // @ts-expect-error - Adapters need updating
      totalDeposited: dto.totalDeposited ? new BN(dto.totalDeposited) : undefined as unknown as PublicKey | BN,
      // @ts-expect-error - Adapters need updating
      cap: dto.cap ? new BN(dto.cap) : undefined as unknown as PublicKey | BN,
      // @ts-expect-error - Adapters need updating
      maturityTs: dto.maturityTs ? new BN(dto.maturityTs) : undefined as unknown as PublicKey | BN,
      // @ts-expect-error - Adapters need updating
      fundingEndTs: dto.fundingEndTs ? new BN(dto.fundingEndTs) : undefined as unknown as PublicKey | BN,
      status: stringToVaultStatus(dto.status),
    },
  };
}

/**
 * Convert PositionDTO from backend to PositionAccount format used by frontend
 *
 * NOTE: This adapter needs to be updated to match the actual backend DTO fields.
 * For now, it's commented out until the full migration is complete.
 */
export function positionDtoToAccount(dto: PositionDTO): {
  publicKey: PublicKey;
  account: Partial<PositionAccount>;
} {
  return {
    publicKey: new PublicKey(dto.positionPda),
    account: {
      vault: new PublicKey(dto.vaultPda),
      owner: new PublicKey(dto.owner),
      // @ts-expect-error - Adapters need updating
      deposited: dto.deposited ? new BN(dto.deposited) : undefined as unknown as PublicKey | BN,
      // @ts-expect-error - Adapters need updating
      claimed: dto.claimed ? new BN(dto.claimed) : undefined as unknown as PublicKey | BN,
    },
  };
}

/**
 * Map backend activity action to frontend EventTag
 */
function mapActivityActionToEventTag(action: ActivityDTO['type']): EventTag {
  switch (action) {
    case 'deposit':
      return 'Deposit';
    case 'claim':
      return 'Claim';
    case 'vault_created':
    case 'matured':
    case 'canceled':
      return 'Params'; // Admin/system events
    default:
      return 'Params';
  }
}

/**
 * Convert ActivityDTO from backend to VaultEvent format used by frontend
 */
export function activityDtoToVaultEvent(dto: ActivityDTO): VaultEvent {
  // Convert ISO timestamp to seconds (Solana blockTime format)
  const timestamp = dto.blockTime ? new Date(dto.blockTime).getTime() / 1000 : Date.now() / 1000;

  // Determine wallet address (owner for user actions, authority for admin actions)
  const wallet = dto.owner || dto.authority || '';

  // Determine amount (would need additional data from transaction details)
  // For now, default to 0 - this might need enhancement
  const amountSol = 0;

  // Build Solscan transaction URL
  const txUrl = `https://solscan.io/tx/${dto.txSig}`;

  // Generate note based on action
  let note: string | undefined;
  switch (dto.type) {
    case 'vault_created':
      note = 'Vault initialized';
      break;
    case 'matured':
      note = 'Vault reached maturity';
      break;
    case 'canceled':
      note = 'Vault was canceled';
      break;
    default:
      note = undefined;
  }

  return {
    id: dto.id,
    tag: mapActivityActionToEventTag(dto.type),
    ts: new Date(timestamp * 1000).toISOString(),
    wallet,
    amountSol,
    txUrl,
    note,
  };
}

/**
 * Convert array of VaultDTOs to VaultAccount format
 */
export function vaultDtosToAccounts(dtos: VaultDTO[]): Array<{
  publicKey: PublicKey;
  account: Partial<VaultAccount>;
}> {
  return dtos.map(vaultDtoToAccount);
}

/**
 * Convert array of PositionDTOs to PositionAccount format
 */
export function positionDtosToAccounts(dtos: PositionDTO[]): Array<{
  publicKey: PublicKey;
  account: Partial<PositionAccount>;
}> {
  return dtos.map(positionDtoToAccount);
}

/**
 * Convert array of ActivityDTOs to VaultEvent format
 */
export function activityDtosToVaultEvents(dtos: ActivityDTO[]): VaultEvent[] {
  return dtos.map(activityDtoToVaultEvent);
}
