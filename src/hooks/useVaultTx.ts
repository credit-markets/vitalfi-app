"use client";

import { toast } from "sonner";

/**
 * useVaultTx Hook
 *
 * Provides transaction functions for all vault operations:
 * - deposit: Deposit SOL to mint shares
 * - redeemPrincipal: Redeem unlocked share lots for SOL
 * - requestWithdrawal: Create withdrawal request for locked lots
 * - claimWithdrawal: Claim processed withdrawal
 */

export interface DepositResult {
  sharesMinted: number;
  unlockAt: string;
  txSignature: string;
}

export interface RedeemResult {
  solOut: number;
  sharesRedeemed: number;
  txSignature: string;
}

export interface WithdrawRequestResult {
  requestIds: string[];
  claimableAt: string;
  txSignature: string;
}

export interface ClaimResult {
  solClaimed: number;
  txSignature: string;
}

export function useVaultTx() {
  /**
   * Deposit SOL to mint shares
   */
  const deposit = async (solAmount: number): Promise<DepositResult> => {
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const sharesMinted = solAmount;
    const unlockAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const txSignature = `5J${Math.random().toString(36).substring(2, 15)}ABC`;

    toast.success(`Deposited ${solAmount} SOL successfully!`);

    return {
      sharesMinted,
      unlockAt,
      txSignature,
    };
  };

  /**
   * Redeem unlocked share lots for SOL
   */
  const redeemPrincipal = async (lotIds: string[]): Promise<RedeemResult> => {
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock: calculate total shares from selected lots
    const sharesRedeemed = lotIds.length * 25; // Assume 25 shares per lot for mock
    const solOut = sharesRedeemed * 1.02; // 1.02x redemption

    const txSignature = `7L${Math.random().toString(36).substring(2, 15)}GHI`;

    toast.success(`Redeemed ${sharesRedeemed} shares for ${solOut.toFixed(2)} SOL`);

    return {
      solOut,
      sharesRedeemed,
      txSignature,
    };
  };

  /**
   * Create withdrawal request for locked share lots
   * Starts 2-day queue process
   */
  const requestWithdrawal = async (lotIds: string[]): Promise<WithdrawRequestResult> => {
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const claimableAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const requestIds = lotIds.map(
      (id) => `req-${Math.random().toString(36).substring(2, 10)}`
    );
    const txSignature = `8M${Math.random().toString(36).substring(2, 15)}JKL`;

    toast.success(`Withdrawal request created. Claimable in 2 days.`);

    return {
      requestIds,
      claimableAt,
      txSignature,
    };
  };

  /**
   * Claim processed withdrawal request
   */
  const claimWithdrawal = async (requestId: string): Promise<ClaimResult> => {
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const solClaimed = 10.2; // Mock value
    const txSignature = `9N${Math.random().toString(36).substring(2, 15)}MNO`;

    toast.success(`Claimed ${solClaimed.toFixed(2)} SOL`);

    return {
      solClaimed,
      txSignature,
    };
  };

  return {
    deposit,
    redeemPrincipal,
    requestWithdrawal,
    claimWithdrawal,
  };
}
