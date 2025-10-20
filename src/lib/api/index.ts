/**
 * VitalFi Backend API
 *
 * Re-export API client, types, and adapters for easy importing
 */

export {
  api,
  getHealth,
  listVaults,
  listPositions,
  getActivity,
  ApiError,
} from './client';

export type {
  VaultDTO,
  PositionDTO,
  ActivityDTO,
  PaginatedResponse,
} from './client';

export {
  vaultDtoToAccount,
  positionDtoToAccount,
  activityDtoToVaultEvent,
  vaultDtosToAccounts,
  positionDtosToAccounts,
  activityDtosToVaultEvents,
} from './adapters';
