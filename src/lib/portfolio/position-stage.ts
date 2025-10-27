/**
 * Position stage mapping utilities
 * Maps VaultStatus + claim state to unified PositionStage
 */

import type { VaultStatus } from "@/types/vault";

export type PositionStage =
  | 'funding'
  | 'matured-claimable'
  | 'matured-claimed'
  | 'canceled-refundable'
  | 'canceled-refunded';

/**
 * Determine position stage from vault status and claim state
 */
export function getPositionStage(
  vaultStatus: VaultStatus,
  hasClaimed: boolean
): PositionStage {
  switch (vaultStatus) {
    case 'Funding':
    case 'Active':
      return 'funding';

    case 'Matured':
      return hasClaimed ? 'matured-claimed' : 'matured-claimable';

    case 'Canceled':
      return hasClaimed ? 'canceled-refunded' : 'canceled-refundable';

    case 'Closed':
      // Closed vaults should have been claimed
      return 'canceled-refunded';

    default:
      return 'funding';
  }
}

/**
 * Get badge text for position stage
 */
export function getStageBadgeText(stage: PositionStage): string {
  switch (stage) {
    case 'funding':
      return 'Funding';
    case 'matured-claimable':
      return 'Matured';
    case 'matured-claimed':
      return 'Matured • Claimed';
    case 'canceled-refundable':
      return 'Canceled';
    case 'canceled-refunded':
      return 'Canceled • Refunded';
  }
}

/**
 * Get badge colors for position stage
 */
export function getStageBadgeColors(stage: PositionStage): string {
  switch (stage) {
    case 'funding':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'matured-claimable':
    case 'matured-claimed':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'canceled-refundable':
    case 'canceled-refunded':
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Get state line text for position stage
 */
export function getStateLineText(
  stage: PositionStage,
  fundingEndsInDays?: number
): string {
  switch (stage) {
    case 'funding':
      return fundingEndsInDays !== undefined
        ? `Funding ends in ${fundingEndsInDays} ${fundingEndsInDays === 1 ? 'day' : 'days'}`
        : 'Funding phase active';
    case 'matured-claimable':
      return 'Vault matured — funds ready to claim';
    case 'matured-claimed':
      return 'Vault matured — already claimed';
    case 'canceled-refundable':
      return 'Vault canceled — deposit refundable';
    case 'canceled-refunded':
      return 'Vault canceled — refunded';
  }
}

/**
 * Get outcome section title for position stage
 */
export function getOutcomeTitle(stage: PositionStage): string {
  switch (stage) {
    case 'funding':
      return 'Projected Return at Maturity';
    case 'matured-claimable':
    case 'matured-claimed':
      return 'Your Final Return';
    case 'canceled-refundable':
    case 'canceled-refunded':
      return 'Refund';
  }
}
