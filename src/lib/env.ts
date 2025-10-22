/**
 * Environment Configuration
 *
 * Validates and exports all environment variables.
 * Throws on missing required variables in production.
 */

function getEnv(key: string, required = true): string {
  const value = process.env[key];

  if (!value) {
    if (required) {
      const isDev = process.env.NODE_ENV === 'development';
      const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
      
      if (isDev || isBuild) {
        console.warn(`⚠️  Missing environment variable: ${key}`);
        return '';
      } else {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    return '';
  }

  return value;
}

export const env = {
  // Vault Authority - required for querying vaults
  vaultAuthority: getEnv('NEXT_PUBLIC_VAULT_AUTHORITY', true),

  // Backend API
  backendUrl: getEnv('NEXT_PUBLIC_API_URL', false) || 'http://localhost:3000',

  // Solana Network
  solanaNetwork: getEnv('NEXT_PUBLIC_SOLANA_NETWORK', false) || 'devnet',

  // Solana RPC
  solanaRpc: getEnv('NEXT_PUBLIC_SOLANA_RPC_ENDPOINT', false),

  // Program ID
  programId: getEnv('NEXT_PUBLIC_PROGRAM_ID', true),
} as const;
