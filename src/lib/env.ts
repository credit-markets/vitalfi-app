/**
 * Environment Configuration
 *
 * Direct access to Next.js environment variables.
 * NEXT_PUBLIC_* variables are automatically embedded at build time.
 */

export const env = {
  // Vault Authority - required for querying vaults
  vaultAuthority: process.env.NEXT_PUBLIC_VAULT_AUTHORITY || '',

  // Backend API
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  // Solana Network
  solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',

  // Solana RPC
  solanaRpc: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || '',

  // Program ID
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || '',
} as const;
