/**
 * VitalFi Backend API Client
 *
 * Type-safe client with ETag/304 support and React Query integration.
 * Implements production-grade error handling, abort signals, and cache correctness.
 *
 * @see FRONTEND_INTEGRATION_GUIDE.md
 * @see BACKEND_ROUTES_SPEC.md
 */

import { env } from "@/lib/env";
import type { VaultStage } from "@/types/vault";

// ============================================================================
// DTOs (matching backend/src/types/dto.ts exactly)
// ============================================================================

export type VaultStatus = "Funding" | "Active" | "Matured" | "Canceled";

/**
 * Maps backend VaultStatus to frontend VaultStage
 *
 * Backend statuses:
 * - Funding: Accepting deposits
 * - Active: Funded, authority has withdrawn funds
 * - Canceled: Funding failed (< 2/3 cap), users can claim refunds
 * - Matured: Vault matured, users can claim payouts
 *
 * Frontend stages:
 * - Funding: Vault is accepting deposits
 * - Funded: Vault is active and funded
 * - Matured: Vault has matured
 * - Closed: Vault is canceled (funding failed)
 */
export function mapVaultStatusToStage(status: VaultStatus): VaultStage {
  const mapping: Record<VaultStatus, VaultStage> = {
    'Funding': 'Funding',
    'Active': 'Funded',
    'Matured': 'Matured',
    'Canceled': 'Closed',  // Funding failed - show as closed to users
  };

  return mapping[status] || 'Funding'; // Safe default
}

export interface VaultDTO {
  vaultPda: string;
  vaultTokenAccount: string;
  authority: string;
  vaultId: string;
  assetMint: string | null;
  status: VaultStatus;
  cap: string | null;
  totalDeposited: string | null;
  totalClaimed: string | null;
  targetApyBps: number | null;
  minDeposit: string | null;
  fundingEndTs: string | null;
  maturityTs: string | null;
  payoutNum: string | null; // Payout numerator (u128 as string)
  payoutDen: string | null; // Payout denominator (u128 as string)
  slot: number | null;
  updatedAt: string; // ISO 8601
  updatedAtEpoch: number; // Unix epoch for cursors
}

export interface PositionDTO {
  positionPda: string;
  vaultPda: string;
  owner: string;
  deposited: string | null;
  claimed: string | null;
  slot: number | null;
  updatedAt: string;
  updatedAtEpoch: number;
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
  id: string;
  txSig: string;
  slot: number;
  blockTime: string | null;
  blockTimeEpoch: number | null;
  type: ActivityType;
  vaultPda: string | null;
  positionPda: string | null;
  authority: string | null;
  owner: string | null;
  amount: string | null;
  assetMint: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: number | null; // Numeric epoch cursor
  total: number | null;
}

// ============================================================================
// Error Handling
// ============================================================================

export class BackendApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

// ============================================================================
// ETag Cache (localStorage)
// ============================================================================

const ETAG_CACHE_KEY = "vitalfi:etags";
const DATA_CACHE_PREFIX = "vitalfi:cache:";

function getEtagFromCache(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const cache = JSON.parse(localStorage.getItem(ETAG_CACHE_KEY) || "{}");
    return cache[key] || null;
  } catch {
    return null;
  }
}

function setEtagInCache(key: string, etag: string): void {
  if (typeof window === "undefined") return;
  try {
    const cache = JSON.parse(localStorage.getItem(ETAG_CACHE_KEY) || "{}");
    cache[key] = etag;
    localStorage.setItem(ETAG_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to cache ETag:", error);
  }
}

function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const cache = JSON.parse(
      localStorage.getItem(`${DATA_CACHE_PREFIX}${key}`) || "null"
    );
    return cache;
  } catch {
    return null;
  }
}

/**
 * Clear oldest cache entries to free up space (LRU eviction)
 */
function clearOldestCacheEntries(): void {
  if (typeof window === "undefined") return;

  try {
    // Get all cache keys with timestamps
    const cacheEntries: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DATA_CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          // Assume data has updatedAtEpoch or use current time as fallback
          const timestamp =
            data?.updatedAtEpoch || data?.timestamp || Date.now() / 1000;
          cacheEntries.push({ key, timestamp });
        } catch {
          // If we can't parse it, mark it for deletion
          cacheEntries.push({ key, timestamp: 0 });
        }
      }
    }

    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(cacheEntries.length * 0.25);
    for (let i = 0; i < toRemove && i < cacheEntries.length; i++) {
      localStorage.removeItem(cacheEntries[i].key);
    }

    console.log(`Cleared ${toRemove} old cache entries`);
  } catch (error) {
    console.error("Failed to clear old cache entries:", error);
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${DATA_CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    // Handle quota exceeded
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      console.warn(
        "LocalStorage quota exceeded, clearing old cache and retrying"
      );

      // Clear oldest entries (LRU eviction)
      clearOldestCacheEntries();

      // Retry once after cleanup
      try {
        localStorage.setItem(`${DATA_CACHE_PREFIX}${key}`, JSON.stringify(data));
      } catch (retryError) {
        console.error("Failed to cache even after cleanup:", retryError);
      }
    } else {
      console.warn("Failed to cache data:", error);
    }
  }
}

// ============================================================================
// Fetch Wrapper with Abort Safety and 304 Fallback
// ============================================================================

interface ApiFetchOptions extends RequestInit {
  cacheKey?: string;
  retryOn304?: boolean; // Retry without ETag if 304 fails (first-load edge case)
}

/**
 * Normalize endpoint for consistent cache keys
 * Sorts query parameters to prevent cache misses from parameter reordering
 */
function normalizeEndpoint(endpoint: string): string {
  const [path, query] = endpoint.split('?');
  if (!query) return endpoint;

  const params = new URLSearchParams(query);
  // Sort parameters alphabetically for consistent cache keys
  const sorted = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  return `${path}?${new URLSearchParams(sorted).toString()}`;
}

async function apiFetch<T>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<T> {
  const baseUrl = env.backendUrl;
  const url = `${baseUrl}${endpoint}`;
  const cacheKey = options?.cacheKey || normalizeEndpoint(endpoint);

  // Add ETag header if cached
  const cachedEtag = getEtagFromCache(cacheKey);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge options headers
  if (options?.headers) {
    const optHeaders = new Headers(options.headers);
    optHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (cachedEtag) {
    headers["If-None-Match"] = cachedEtag;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Abort signal from caller (React Query provides this)
      signal: options?.signal,
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      const cached = getCachedData<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // If we get 304 but have no cached data (first-load edge case),
      // retry without ETag header
      if (options?.retryOn304 !== false) {
        console.warn(
          "304 received but no cached data found, retrying without ETag"
        );
        // Retry without ETag by not providing cacheKey (which would add the ETag)
        const newOptions = {
          ...options,
          retryOn304: false,
          signal: options?.signal, // Preserve abort signal for React Query cancellation
        };
        // Clear headers to remove If-None-Match
        delete (newOptions as { headers?: unknown }).headers;
        return apiFetch<T>(endpoint, newOptions);
      }

      throw new BackendApiError("304 received but no cached data found", 304);
    }

    // Handle errors
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Response wasn't JSON
      }
      throw new BackendApiError(errorMessage, response.status);
    }

    const data = await response.json();

    // Cache ETag and data
    const etag = response.headers.get("ETag");
    if (etag) {
      setEtagInCache(cacheKey, etag);
      setCachedData(cacheKey, data);
    }

    return data;
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      throw new BackendApiError("Request aborted", 0, error);
    }

    if (error instanceof BackendApiError) {
      throw error;
    }

    // Network errors
    if (error instanceof Error) {
      throw new BackendApiError(`Network error: ${error.message}`, 0, error);
    }

    throw new BackendApiError("Unknown error", 0);
  }
}

// ============================================================================
// Query String Builder
// ============================================================================

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * List vaults by authority with optional filtering
 */
export async function listVaults(
  params: {
    authority: string;
    status?: VaultStatus;
    cursor?: number;
    limit?: number;
  },
  options?: { signal?: AbortSignal }
): Promise<PaginatedResponse<VaultDTO>> {
  const query = buildQueryString(params);
  const endpoint = `/api/vaults${query}`;
  return apiFetch<PaginatedResponse<VaultDTO>>(endpoint, {
    cacheKey: endpoint,
    signal: options?.signal,
  });
}

/**
 * List positions by owner
 */
export async function listPositions(
  params: {
    owner: string;
    cursor?: number;
    limit?: number;
  },
  options?: { signal?: AbortSignal }
): Promise<PaginatedResponse<PositionDTO>> {
  const query = buildQueryString(params);
  const endpoint = `/api/positions${query}`;
  return apiFetch<PaginatedResponse<PositionDTO>>(endpoint, {
    cacheKey: endpoint,
    signal: options?.signal,
  });
}

/**
 * Get activity feed (vault or owner)
 */
export async function getActivity(
  params: {
    vault?: string;
    owner?: string;
    cursor?: number;
    limit?: number;
    type?: ActivityType;
  },
  options?: { signal?: AbortSignal }
): Promise<PaginatedResponse<ActivityDTO>> {
  if (!params.vault && !params.owner) {
    throw new Error("Either vault or owner parameter is required");
  }
  const query = buildQueryString(params);
  const endpoint = `/api/activity${query}`;
  return apiFetch<PaginatedResponse<ActivityDTO>>(endpoint, {
    cacheKey: endpoint,
    signal: options?.signal,
  });
}

/**
 * Health check
 */
export async function getHealth(options?: {
  signal?: AbortSignal;
}): Promise<{ ok: boolean; kv: boolean; timestamp: string }> {
  return apiFetch("/api/health", { signal: options?.signal });
}

// ============================================================================
// Default Export
// ============================================================================

export const backendApi = {
  listVaults,
  listPositions,
  getActivity,
  getHealth,
};

export default backendApi;
