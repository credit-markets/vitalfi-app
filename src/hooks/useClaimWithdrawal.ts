"use client";

import { toast } from "sonner";

/**
 * Hook to claim a pending withdrawal
 */
export function useClaimWithdrawal() {
  const claim = async (id: string) => {
    try {
      // In production, would call on-chain claim instruction
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Withdrawal claimed successfully!");
      return true;
    } catch (error) {
      toast.error("Failed to claim withdrawal");
      return false;
    }
  };

  return { claim };
}
