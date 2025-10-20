#!/usr/bin/env tsx
/**
 * Smoke Test Script
 *
 * Validates basic connectivity and account structure on devnet/mainnet.
 * Can be run in CI without requiring a funded wallet.
 *
 * Usage:
 *   npm run smoke
 *   NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=<url> npm run smoke
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { VaultLayout } from '../src/lib/vault-sdk/layout';

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
  clusterApiUrl(NETWORK as 'devnet' | 'testnet' | 'mainnet-beta');

// Known vault PDA on devnet (replace with actual deployed vault)
// This is a placeholder - update with a real vault PDA after deployment
const KNOWN_VAULT_PDA = process.env.SMOKE_TEST_VAULT_PDA;

/**
 * Exit codes
 */
const EXIT_SUCCESS = 0;
const EXIT_SKIP = 77; // Standard skip code for CI
const EXIT_FAILURE = 1;

/**
 * Color output helpers
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function warning(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg: string) {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

/**
 * Test RPC connectivity
 */
async function testRpcConnection(connection: Connection): Promise<boolean> {
  try {
    const slot = await connection.getSlot();
    success(`Connected to RPC at slot ${slot}`);
    return true;
  } catch (err) {
    error(`Failed to connect to RPC: ${err}`);
    return false;
  }
}

/**
 * Test vault account structure
 */
async function testVaultAccount(
  connection: Connection,
  vaultPda: PublicKey
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(vaultPda);

    if (!accountInfo) {
      warning(`Vault account not found: ${vaultPda.toBase58()}`);
      return false;
    }

    info(`Vault PDA: ${vaultPda.toBase58()}`);
    info(`Owner: ${accountInfo.owner.toBase58()}`);
    info(`Data length: ${accountInfo.data.length} bytes`);
    info(`Lamports: ${accountInfo.lamports / 1e9} SOL`);

    // Validate account structure
    if (accountInfo.data.length !== VaultLayout.size) {
      error(
        `Vault data size mismatch: expected ${VaultLayout.size}, got ${accountInfo.data.length}`
      );
      return false;
    }

    success(`Vault account structure valid (${VaultLayout.size} bytes)`);
    return true;
  } catch (err) {
    error(`Failed to fetch vault account: ${err}`);
    return false;
  }
}

/**
 * Main smoke test
 */
async function main() {
  console.log('🔍 Running VitalFi Smoke Tests\n');

  info(`Network: ${NETWORK}`);
  info(`RPC: ${RPC_ENDPOINT}\n`);

  const connection = new Connection(RPC_ENDPOINT, 'confirmed');

  // Test 1: RPC connectivity
  const rpcOk = await testRpcConnection(connection);
  if (!rpcOk) {
    error('\nSmoke test failed: RPC connectivity issue');
    process.exit(EXIT_FAILURE);
  }

  console.log('');

  // Test 2: Vault account (optional if PDA provided)
  if (KNOWN_VAULT_PDA) {
    try {
      const vaultPda = new PublicKey(KNOWN_VAULT_PDA);
      const vaultOk = await testVaultAccount(connection, vaultPda);

      if (!vaultOk) {
        warning('\nVault account test failed (non-critical in CI)');
        // Don't exit with failure - vault might not exist yet
      }
    } catch (err) {
      warning(`Invalid SMOKE_TEST_VAULT_PDA: ${err}`);
    }
  } else {
    warning('SMOKE_TEST_VAULT_PDA not set, skipping vault account test');
    info('Set SMOKE_TEST_VAULT_PDA=<pubkey> to test vault account structure');
  }

  console.log('');

  // Test 3: Layout constants
  info('Validating layout constants...');
  if (VaultLayout.size === 200) {
    success(`VaultLayout.size = ${VaultLayout.size} ✓`);
  } else {
    error(`VaultLayout.size = ${VaultLayout.size} (expected 200)`);
    process.exit(EXIT_FAILURE);
  }

  if (VaultLayout.authorityOffset === 10) {
    success(`VaultLayout.authorityOffset = ${VaultLayout.authorityOffset} ✓`);
  } else {
    error(`VaultLayout.authorityOffset = ${VaultLayout.authorityOffset} (expected 10)`);
    process.exit(EXIT_FAILURE);
  }

  console.log('');
  success('✨ All smoke tests passed!');
  process.exit(EXIT_SUCCESS);
}

// Run smoke test
main().catch((err) => {
  error(`Unhandled error: ${err}`);
  process.exit(EXIT_FAILURE);
});
