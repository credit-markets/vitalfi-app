/**
 * VitalFi Backend API
 *
 * Re-export API client and types for easy importing
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
