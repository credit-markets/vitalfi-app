/**
 * Finalized Reconciliation
 *
 * After mutations, fetch accounts at "finalized" commitment to ensure
 * cache consistency even if reorgs occur. Only updates cache if data differs.
 */

import type { Connection, PublicKey } from "@solana/web3.js";
import { bufEq } from "@/lib/solana/buf";

/**
 * Reconcile accounts at finalized commitment
 *
 * Fetches accounts with "finalized" commitment and compares against current
 * cache data. Only triggers onChange if the finalized data differs.
 *
 * **Use case**: After deposit/claim at "confirmed", reconcile to "finalized"
 * to ensure cache is consistent even if a reorg occurs.
 *
 * @param connection - Solana connection
 * @param pubkeys - Account public keys to reconcile
 * @param decode - Function to decode account data
 * @param onChange - Callback when finalized data differs from cache
 *
 * @example
 * ```typescript
 * // After deposit confirmed
 * await reconcileFinalized(
 *   connection,
 *   [vaultPda, positionPda],
 *   (data) => program.coder.accounts.decode('vault', data),
 *   (pubkey, account) => {
 *     queryClient.setQueryData(['vault', pubkey.toString()], account);
 *   }
 * );
 * ```
 */
export async function reconcileFinalized<T>(
  connection: Connection,
  pubkeys: PublicKey[],
  decode: (data: Buffer) => T,
  onChange: (pubkey: PublicKey, account: T, data: Buffer) => void,
  currentDataMap?: Map<string, Buffer>
): Promise<void> {
  if (pubkeys.length === 0) return;

  try {
    // Fetch all accounts at finalized commitment
    const accountInfos = await connection.getMultipleAccountsInfo(
      pubkeys,
      "finalized"
    );

    // Process each account
    for (let i = 0; i < pubkeys.length; i++) {
      const pubkey = pubkeys[i];
      const accountInfo = accountInfos[i];

      if (!accountInfo) {
        console.warn(`Account not found during reconciliation: ${pubkey.toBase58()}`);
        continue;
      }

      // Check if data actually changed (buffer comparison)
      const currentData = currentDataMap?.get(pubkey.toBase58());
      if (currentData && bufEq(currentData, accountInfo.data)) {
        // Data unchanged, skip update
        continue;
      }

      try {
        // Decode and notify
        const decoded = decode(accountInfo.data);
        onChange(pubkey, decoded, accountInfo.data);
      } catch (error) {
        console.error(
          `Failed to decode account during reconciliation: ${pubkey.toBase58()}`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Finalized reconciliation failed:", error);
    // Don't throw - reconciliation is a safety net, not critical path
  }
}

/**
 * Simpler single-account reconciliation
 *
 * @param connection - Solana connection
 * @param pubkey - Account public key
 * @param decode - Decode function
 * @param onChange - Callback when data changes
 * @param currentData - Current buffer data (optional, for comparison)
 */
export async function reconcileSingleAccount<T>(
  connection: Connection,
  pubkey: PublicKey,
  decode: (data: Buffer) => T,
  onChange: (account: T, data: Buffer) => void,
  currentData?: Buffer
): Promise<void> {
  await reconcileFinalized(
    connection,
    [pubkey],
    decode,
    (_pubkey, account, data) => onChange(account, data),
    currentData ? new Map([[pubkey.toBase58(), currentData]]) : undefined
  );
}
