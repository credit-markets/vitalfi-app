/**
 * Backend API Hooks
 *
 * React Query hooks for fetching data from the VitalFi backend API.
 *
 * NEW API-backed hooks (with ETag/304 caching):
 * - useVaultsAPI, usePositionsAPI, useActivityAPI, useInfiniteActivity
 *
 * Legacy RPC hooks (will be deprecated):
 * - useVaults, useVaultByPda, useAllVaults
 * - useUserPositions, useVaultPositions, usePosition
 * - useAuthorityActivity, useUserActivity, useActivity
 */

// NEW: Backend API hooks with ETag/304 caching
export * from "./use-vaults-api";
export * from "./use-positions-api";
export * from "./use-activity-api";

// Legacy: Existing vault hooks (RPC-based)
export {
  useVaults,
  useVaultByPda,
  useAllVaults,
  type UseVaultsOptions,
} from "./use-vaults";

// Legacy: Position hooks
export {
  useUserPositions,
  useVaultPositions,
  usePosition,
  type UsePositionsOptions,
} from "./use-positions";

// Legacy: Activity hooks
export {
  useAuthorityActivity,
  useUserActivity,
  useActivity,
  type UseActivityOptions,
} from "./use-activity";
