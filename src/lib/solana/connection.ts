import { Connection, clusterApiUrl, Commitment } from "@solana/web3.js";
import { env } from "@/lib/env";

export const SOLANA_NETWORK = env.solanaNetwork;
export const SOLANA_RPC_ENDPOINT =
  env.solanaRpc || clusterApiUrl(SOLANA_NETWORK as "devnet" | "testnet" | "mainnet-beta");

export const DEFAULT_COMMITMENT: Commitment = "confirmed";

export function getSolanaConnection(commitment: Commitment = DEFAULT_COMMITMENT): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, commitment);
}

export const connection = getSolanaConnection();
