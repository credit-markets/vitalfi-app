import { Connection, clusterApiUrl, Commitment } from "@solana/web3.js";

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK as any);

export const DEFAULT_COMMITMENT: Commitment = "confirmed";

export function getSolanaConnection(commitment: Commitment = DEFAULT_COMMITMENT): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, commitment);
}

export const connection = getSolanaConnection();
