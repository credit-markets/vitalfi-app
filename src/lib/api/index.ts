/**
 * VitalFi Backend API
 *
 * Re-export API client, types, and adapters for easy importing
 */

export {
  backendApi,
  getHealth,
  listVaults,
  listPositions,
  getActivity,
  BackendApiError,
} from './backend';

export type {
  VaultDTO,
  PositionDTO,
  ActivityDTO,
  ActivityType,
  VaultStatus,
  PaginatedResponse,
} from './backend';

export {
  vaultDtoToAccount,
  positionDtoToAccount,
  activityDtoToVaultEvent,
  vaultDtosToAccounts,
  positionDtosToAccounts,
  activityDtosToVaultEvents,
} from './adapters';
