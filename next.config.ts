import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // WalletConnect's dependencies (specifically Pino logger) attempt to import
      // server-only Node.js modules. These are not needed on the client side and
      // should be excluded from the client bundle to avoid build warnings.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,          // File system operations (server-only)
        net: false,         // Network operations (server-only)
        tls: false,         // TLS/SSL (server-only)
        'pino-pretty': false, // Pino's dev formatter (unused, optional dep)
      };
    }

    // Suppress expected warnings from Solana libraries
    // @solana/web3.js uses native bindings for bigint operations which may
    // fail to load in some environments, but falls back to pure JS implementation
    config.ignoreWarnings = [
      { module: /node_modules\/@solana\/web3\.js/ },
      { message: /bigint.*Failed to load bindings/ },
    ];

    return config;
  },

  // Note: Turbopack automatically handles optional dependencies and module
  // resolution correctly, so it doesn't need the fallback configuration that
  // webpack requires above. This is expected behavior.
};

export default nextConfig;
