"use client";

import { useMemo } from "react";
import { useVaultProgram } from "@/lib/solana/provider";
import { VaultClient } from "@/lib/sdk";

/**
 * Hook to get VaultClient instance
 *
 * Returns null if wallet is not connected.
 *
 * @example
 * ```typescript
 * const client = useVaultClient();
 * if (client) {
 *   const vault = await client.getVault(authority, vaultId);
 * }
 * ```
 */
export function useVaultClient(): VaultClient | null {
  const { program } = useVaultProgram();

  return useMemo(() => {
    if (!program) return null;
    return new VaultClient(program);
  }, [program]);
}
