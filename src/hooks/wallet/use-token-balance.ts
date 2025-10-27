/**
 * Hook to fetch SPL token balance for connected wallet
 */

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getTokenDecimals } from "@/lib/sdk/config";

export function useTokenBalance(mintAddress: string | null) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["token-balance", publicKey?.toBase58(), mintAddress],
    queryFn: async (): Promise<number> => {
      if (!publicKey || !mintAddress) return 0;

      try {
        const mint = new PublicKey(mintAddress);
        const decimals = getTokenDecimals(mintAddress);

        // Get associated token account address
        const tokenAccount = await getAssociatedTokenAddress(
          mint,
          publicKey
        );

        // Fetch token account data
        const accountInfo = await getAccount(connection, tokenAccount);

        // Convert to human-readable amount
        return Number(accountInfo.amount) / Math.pow(10, decimals);
      } catch {
        // Account doesn't exist or other error - return 0
        return 0;
      }
    },
    enabled: !!publicKey && !!mintAddress,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}
