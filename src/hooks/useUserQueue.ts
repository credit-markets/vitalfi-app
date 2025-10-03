"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getMockUserData } from "@/lib/solana/mock-data";

export interface PendingRequest {
  amountShares: number;
  claimAt: string;
  estSol: number;
}

export interface UserQueue {
  pending?: PendingRequest;
  countdown: string;
  canClaim: boolean;
}

/**
 * Hook to fetch user's pending withdrawal request and claim status
 * Returns pending request details, countdown, and whether user can claim
 */
export function useUserQueue(): UserQueue {
  const { connected } = useWallet();

  if (!connected) {
    return { countdown: "", canClaim: false };
  }

  const userData = getMockUserData(true);

  if (userData.pendingWithdrawals.length === 0) {
    return { countdown: "", canClaim: false };
  }

  const pending = userData.pendingWithdrawals[0];
  const claimAtDate = new Date(pending.claimAt);
  const now = Date.now();
  const canClaim = claimAtDate.getTime() <= now;

  // Calculate countdown
  const diff = claimAtDate.getTime() - now;
  let countdown = "";

  if (canClaim) {
    countdown = "Ready to claim";
  } else {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      countdown = `${days}d ${remainingHours}h remaining`;
    } else if (hours > 0) {
      countdown = `${hours}h remaining`;
    } else {
      countdown = "< 1h remaining";
    }
  }

  return {
    pending: {
      amountShares: pending.amount,
      claimAt: pending.claimAt,
      estSol: pending.estSolOut,
    },
    countdown,
    canClaim,
  };
}
