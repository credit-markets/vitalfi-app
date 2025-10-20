/**
 * Hook to fetch vault transaction history
 */

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fetchVaultTransactions, type VaultTransaction } from "../vault-sdk/transactions";

export function useVaultTransactions(vaultPda: PublicKey | null, limit: number = 20) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["vault-transactions", vaultPda?.toBase58(), limit],
    queryFn: async (): Promise<VaultTransaction[]> => {
      if (!vaultPda) return [];
      return fetchVaultTransactions(connection, vaultPda, limit);
    },
    enabled: !!vaultPda,
    staleTime: 60_000, // 1 minute - transactions don't change often
    refetchInterval: 30_000, // Refetch every 30 seconds for new activity
  });
}
