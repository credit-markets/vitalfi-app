/**
 * Environment Variable Validation
 *
 * Ensures required environment variables are set, especially in production.
 * Provides early failure detection instead of runtime errors.
 */

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

/**
 * Require an environment variable
 *
 * @param key - Environment variable key (e.g., "NEXT_PUBLIC_SOLANA_RPC_ENDPOINT")
 * @param prodOnly - Only enforce in production (default: true)
 * @returns The environment variable value
 * @throws {EnvValidationError} If variable is missing in production or when prodOnly=false
 *
 * @example
 * ```typescript
 * const rpcEndpoint = requireEnv("NEXT_PUBLIC_SOLANA_RPC_ENDPOINT");
 * const apiKey = requireEnv("API_KEY", false); // Required in all environments
 * ```
 */
export function requireEnv(key: string, prodOnly: boolean = true): string {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === "production";

  // If variable is missing
  if (!value || value.trim() === "") {
    // In production: always throw
    if (isProduction) {
      throw new EnvValidationError(
        `Missing required environment variable: ${key}. ` +
        `Set this variable before deploying to production.`
      );
    }

    // In development: throw if prodOnly=false
    if (!prodOnly) {
      throw new EnvValidationError(
        `Missing required environment variable: ${key}`
      );
    }

    // In development with prodOnly=true: warn but don't throw
    console.warn(
      `[ENV Warning] Missing ${key}. ` +
      `This will cause a build failure in production.`
    );
    return "";
  }

  return value;
}

/**
 * Get environment variable with default fallback
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 *
 * @example
 * ```typescript
 * const network = getEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
 * ```
 */
export function getEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== "" ? value : defaultValue;
}

/**
 * Validate all required environment variables
 *
 * Call this early in app initialization (e.g., in layout.tsx or _app.tsx)
 * to catch configuration errors before they cause runtime failures.
 *
 * @throws {EnvValidationError} If validation fails in production
 *
 * @example
 * ```typescript
 * // In app/layout.tsx or pages/_app.tsx
 * validateEnv();
 * ```
 */
export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";

  // Required in production
  const productionVars = [
    "NEXT_PUBLIC_SOLANA_RPC_ENDPOINT",
  ];

  // Optional but recommended in production
  const recommendedVars = [
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_PRIORITY_FEE_MICROS",
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of productionVars) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      if (isProduction) {
        errors.push(key);
      } else {
        warnings.push(key);
      }
    }
  }

  // Check recommended variables (warn only)
  if (isProduction) {
    for (const key of recommendedVars) {
      const value = process.env[key];
      if (!value || value.trim() === "") {
        warnings.push(`${key} (recommended)`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn(
      `[ENV Warning] Missing environment variables:\n` +
      warnings.map(k => `  - ${k}`).join("\n")
    );
  }

  // Throw if errors in production
  if (errors.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables in production:\n` +
      errors.map(k => `  - ${k}`).join("\n") +
      `\n\nSet these variables before deploying.`
    );
  }

  // Validate RPC endpoint format if provided
  const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
  if (rpcEndpoint) {
    try {
      new URL(rpcEndpoint);
    } catch {
      const message = `Invalid NEXT_PUBLIC_SOLANA_RPC_ENDPOINT: "${rpcEndpoint}". Must be a valid URL.`;
      if (isProduction) {
        throw new EnvValidationError(message);
      } else {
        console.error(`[ENV Error] ${message}`);
      }
    }
  }

  // Validate priority fee if provided
  const priorityFee = process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS;
  if (priorityFee) {
    const fee = parseInt(priorityFee, 10);
    if (isNaN(fee) || fee < 0) {
      const message = `Invalid NEXT_PUBLIC_PRIORITY_FEE_MICROS: "${priorityFee}". Must be a positive integer.`;
      if (isProduction) {
        throw new EnvValidationError(message);
      } else {
        console.error(`[ENV Error] ${message}`);
      }
    }
  }

  // Success message
  if (isProduction && errors.length === 0) {
    console.log("[ENV] ✓ All required environment variables validated");
  }
}

/**
 * Get validated environment configuration
 *
 * Returns a typed object with all environment variables.
 * Useful for type-safe environment access.
 *
 * @example
 * ```typescript
 * const config = getEnvConfig();
 * console.log(config.solanaNetwork); // "devnet" | "mainnet-beta"
 * ```
 */
export function getEnvConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    solanaNetwork: getEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet"),
    solanaRpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    priorityFeeMicros: process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS
      ? parseInt(process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS, 10)
      : 5000,
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
  };
}
