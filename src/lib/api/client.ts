/**
 * VitalFi Backend API Client
 *
 * Type-safe client for interacting with the VitalFi backend API.
 * Handles request/response formatting, error handling, and caching.
 */

// Backend API DTOs (matching backend/src/types/dto.ts exactly)
export type VaultStatus = "Funding" | "Active" | "Matured" | "Canceled";

export interface VaultDTO {
  vaultPda: string;
  authority: string;
  vaultId: string;
  assetMint: string | null;
  status: VaultStatus;
  cap: string | null;
  totalDeposited: string | null;
  fundingEndTs: string | null;
  maturityTs: string | null;
  slot: number | null;
  updatedAt: string; // ISO 8601
}

export interface PositionDTO {
  positionPda: string;
  vaultPda: string;
  owner: string;
  deposited: string | null;
  claimed: string | null;
  slot: number | null;
  updatedAt: string; // ISO 8601
}

export type ActivityType =
  | "deposit"
  | "claim"
  | "funding_finalized"
  | "authority_withdraw"
  | "matured"
  | "canceled"
  | "vault_created"
  | "position_created";

export interface ActivityDTO {
  id: string; // `${txSig}:${type}:${slot}`
  txSig: string;
  slot: number;
  blockTime: string | null; // ISO 8601 or null
  type: ActivityType;
  vaultPda: string | null;
  positionPda: string | null;
  authority: string | null;
  owner: string | null;
  amount: string | null;
  assetMint: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    cursor?: string;
  };
}

/**
 * API Error class with structured error information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the backend API base URL from environment
 */
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_VITALFI_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_VITALFI_API_URL environment variable is not set');
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle non-JSON error responses
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Response wasn't JSON, use default error message
      }
      throw new ApiError(errorMessage, response.status);
    }

    // Handle 304 Not Modified
    if (response.status === 304) {
      throw new Error('Content not modified');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof Error) {
      throw new ApiError(
        `Network error: ${error.message}`,
        0,
        error
      );
    }

    throw new ApiError('Unknown error occurred', 0);
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Health check endpoint
 */
export async function getHealth(): Promise<{ status: string; timestamp: string }> {
  return apiFetch('/api/health');
}

/**
 * List vaults by authority with optional filters
 */
export async function listVaults(params: {
  authority: string;
  status?: "Funding" | "Active" | "Matured" | "Canceled";
  limit?: number;
}): Promise<PaginatedResponse<VaultDTO>> {
  const query = buildQueryString(params);
  return apiFetch(`/api/vaults${query}`);
}

/**
 * List positions by owner or vault
 */
export async function listPositions(params: {
  owner?: string;
  vault?: string;
  limit?: number;
}): Promise<PaginatedResponse<PositionDTO>> {
  if (!params.owner && !params.vault) {
    throw new Error('Either owner or vault parameter is required');
  }

  const query = buildQueryString(params);
  return apiFetch(`/api/positions${query}`);
}

/**
 * Get activity feed with optional filters
 */
export async function getActivity(params: {
  authority?: string;
  owner?: string;
  action?: ActivityDTO['type'];
  limit?: number;
  before?: string; // Cursor for pagination
}): Promise<PaginatedResponse<ActivityDTO>> {
  const query = buildQueryString(params);
  return apiFetch(`/api/activity${query}`);
}

/**
 * Default export with all API methods
 */
export const api = {
  getHealth,
  listVaults,
  listPositions,
  getActivity,
};

export default api;
