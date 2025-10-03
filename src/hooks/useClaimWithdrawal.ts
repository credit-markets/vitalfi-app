"use client";

import { toast } from "sonner";

/**
 * Hook to claim a pending withdrawal
 */
export function useClaimWithdrawal() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const claim = async (_id: string) => {
    try {
      // In production, would call on-chain claim instruction
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Withdrawal claimed successfully!");
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error("Failed to claim withdrawal");
      return false;
    }
  };

  return { claim };
}
