/**
 * Backend API Hooks
 *
 * React Query hooks for fetching data from the VitalFi backend API.
 */

// Vault hooks
export {
  useVaults,
  useVaultByPda,
  useAllVaults,
  type UseVaultsOptions,
} from './use-vaults';

// Position hooks
export {
  useUserPositions,
  useVaultPositions,
  usePosition,
  type UsePositionsOptions,
} from './use-positions';

// Activity hooks
export {
  useAuthorityActivity,
  useUserActivity,
  useActivity,
  type UseActivityOptions,
} from './use-activity';
