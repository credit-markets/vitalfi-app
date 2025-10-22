/**
 * Transaction History Fetchers
 *
 * Fetches and parses transaction history for vaults using RPC.
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from "@solana/web3.js";
import BN from "bn.js";

export interface VaultTransaction {
  signature: string;
  timestamp: number; // Unix timestamp in seconds
  type: "deposit" | "claim" | "finalize" | "mature" | "close" | "unknown";
  user?: PublicKey;
  amount?: BN;
  blockTime: number;
}

/**
 * Fetch transaction signatures for a vault PDA
 */
export async function fetchVaultSignatures(
  connection: Connection,
  vaultPda: PublicKey,
  limit: number = 50
): Promise<ConfirmedSignatureInfo[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(vaultPda, {
      limit,
    });
    return signatures;
  } catch (error) {
    console.error("Failed to fetch vault signatures:", error);
    return [];
  }
}

/**
 * Parse a transaction to determine type and extract relevant data
 */
function parseVaultTransaction(
  signature: string,
  tx: ParsedTransactionWithMeta | null
): VaultTransaction | null {
  if (!tx || !tx.blockTime) {
    return null;
  }

  // Try to determine transaction type from instruction data
  let type: VaultTransaction["type"] = "unknown";
  let user: PublicKey | undefined;
  let amount: BN | undefined;

  // Look through instructions for vault program calls
  const instructions = tx.transaction.message.instructions;

  for (const ix of instructions) {
    if ("programId" in ix && "data" in ix) {
      // Check if it's our vault program
      // For Anchor instructions, we can check the discriminator (first 8 bytes)
      // deposit discriminator: [242, 35, 198, 137, 82, 225, 242, 182]
      // claim discriminator: would need to check IDL

      // For now, we'll just return the transaction with basic info
      // In production, you'd parse the instruction data properly
      type = "deposit"; // Default assumption for MVP
    }
  }

  return {
    signature,
    timestamp: tx.blockTime,
    type,
    user,
    amount,
    blockTime: tx.blockTime,
  };
}

/**
 * Fetch and parse recent transactions for a vault
 */
export async function fetchVaultTransactions(
  connection: Connection,
  vaultPda: PublicKey,
  limit: number = 50
): Promise<VaultTransaction[]> {
  try {
    // Get signatures
    const signatures = await fetchVaultSignatures(connection, vaultPda, limit);

    if (signatures.length === 0) {
      return [];
    }

    // Fetch full transaction data
    const txs = await connection.getParsedTransactions(
      signatures.map((s) => s.signature),
      {
        maxSupportedTransactionVersion: 0,
      }
    );

    // Parse transactions
    const parsed: VaultTransaction[] = [];
    for (let i = 0; i < txs.length; i++) {
      const parsedTx = parseVaultTransaction(signatures[i].signature, txs[i]);
      if (parsedTx) {
        parsed.push(parsedTx);
      }
    }

    return parsed;
  } catch (error) {
    console.error("Failed to fetch vault transactions:", error);
    return [];
  }
}

/**
 * Simple helper to get recent activity count
 */
export async function getVaultActivityCount(
  connection: Connection,
  vaultPda: PublicKey
): Promise<number> {
  try {
    const signatures = await connection.getSignaturesForAddress(vaultPda, {
      limit: 1,
    });
    return signatures.length;
  } catch (error) {
    console.error("Failed to get activity count:", error);
    return 0;
  }
}
