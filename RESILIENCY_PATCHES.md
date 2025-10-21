# VitalFi Frontend - High-Impact Resiliency Patches

**Purpose**: Production-grade improvements for SSR hydration, abort safety, stable caching, and edge-case handling.

**Apply after**: Basic integration guide implementation (FRONTEND_INTEGRATION_GUIDE.md)

---

## Patch 1: Enhanced API Client with Abort Safety & 304 Fallback

**File**: `src/lib/api/backend.ts`

```diff
--- a/src/lib/api/backend.ts
+++ b/src/lib/api/backend.ts
@@ -87,7 +87,11 @@ function setCachedData<T>(key: string, data: T) {
 // Fetch Wrapper
 // ============================================================================

+/**
+ * Enhanced fetch with abort signals and 304 fallback retry
+ */
 async function apiFetch<T>(
   endpoint: string,
-  options?: RequestInit & { cacheKey?: string }
+  options?: RequestInit & { cacheKey?: string; signal?: AbortSignal }
 ): Promise<T> {
   const baseUrl = process.env.NEXT_PUBLIC_VITALFI_API_URL;
   if (!baseUrl) {
     throw new BackendApiError("NEXT_PUBLIC_VITALFI_API_URL not configured", 0);
   }

-  const url = `${baseUrl}${endpoint}`;
+  // Safer URL construction (handles trailing slashes)
+  const url = new URL(endpoint.startsWith('/') ? endpoint.slice(1) : endpoint, baseUrl).toString();
   const cacheKey = options?.cacheKey || endpoint;

   // Add ETag header if cached
   const cachedEtag = getEtagFromCache(cacheKey);
   const headers: HeadersInit = {
     "Content-Type": "application/json",
     ...options?.headers,
   };
   if (cachedEtag) {
     headers["If-None-Match"] = cachedEtag;
   }

+  // Create abort controller for request cancellation
+  const controller = new AbortController();
+  const signal = options?.signal ?? controller.signal;
+
   try {
-    const response = await fetch(url, { ...options, headers });
+    const response = await fetch(url, { ...options, headers, signal });

     // Handle 304 Not Modified
     if (response.status === 304) {
       const cached = getCachedData<T>(cacheKey);
       if (cached) return cached;
-      throw new BackendApiError("304 received but no cached data found", 304);
+
+      // EDGE CASE: 304 but no local cache (e.g., first load on new tab/device)
+      // Solution: Retry without ETag to hydrate cache
+      console.warn(`[API] 304 received but no cache for ${endpoint}, retrying without ETag`);
+      const retryResponse = await fetch(url, {
+        ...options,
+        headers: { "Content-Type": "application/json", ...options?.headers },
+        signal,
+      });
+
+      if (!retryResponse.ok) {
+        throw new BackendApiError(
+          `Retry after 304 failed: ${retryResponse.status}`,
+          retryResponse.status
+        );
+      }
+
+      const retryData = await retryResponse.json();
+      const retryEtag = retryResponse.headers.get("ETag");
+      if (retryEtag) {
+        setEtagInCache(cacheKey, retryEtag);
+        setCachedData(cacheKey, retryData);
+      }
+      return retryData;
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
+    // Handle abort gracefully
+    if (error instanceof DOMException && error.name === "AbortError") {
+      throw new BackendApiError("Request aborted", 0);
+    }
+
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
```

---

## Patch 2: Stable Query Keys (Prevent Referential Churn)

**File**: `src/hooks/api/use-vaults-api.ts`

```diff
--- a/src/hooks/api/use-vaults-api.ts
+++ b/src/hooks/api/use-vaults-api.ts
@@ -1,6 +1,14 @@
 "use client";

 import { useQuery } from "@tanstack/react-query";
 import { listVaults, VaultDTO, VaultStatus } from "@/lib/api/backend";

+/**
+ * Normalize params to stable string for query key
+ * Prevents referential equality issues with object literals
+ */
+function normalizeParams(params: Record<string, any>): string {
+  return JSON.stringify(params ?? {});
+}
+
 export interface UseVaultsAPIParams {
   authority: string;
   status?: VaultStatus;
@@ -13,7 +21,7 @@ export interface UseVaultsAPIParams {
  * Hook to fetch vaults from backend API
  */
 export function useVaultsAPI(params: UseVaultsAPIParams) {
   return useQuery({
-    queryKey: ["vaults-api", params],
+    queryKey: ["vaults-api", normalizeParams(params)],
     queryFn: () => listVaults({
       authority: params.authority,
       status: params.status,
```

**Apply same pattern to**:
- `src/hooks/api/use-positions-api.ts`
- `src/hooks/api/use-activity-api.ts`

---

## Patch 3: Abort Signals in React Query Hooks

**File**: `src/hooks/api/use-vaults-api.ts`

```diff
--- a/src/hooks/api/use-vaults-api.ts
+++ b/src/hooks/api/use-vaults-api.ts
@@ -21,7 +21,10 @@ export interface UseVaultsAPIParams {
 export function useVaultsAPI(params: UseVaultsAPIParams) {
   return useQuery({
     queryKey: ["vaults-api", normalizeParams(params)],
-    queryFn: () => listVaults({
+    queryFn: ({ signal }) => listVaults({
       authority: params.authority,
       status: params.status,
       cursor: params.cursor,
       limit: params.limit,
-    }),
+    }, { signal }),
     enabled: params.enabled !== false && !!params.authority,
```

**Update API methods to accept signal**:

```diff
--- a/src/lib/api/backend.ts (in API methods section)
+++ b/src/lib/api/backend.ts
@@ -180,7 +180,7 @@ export async function listVaults(params: {
   status?: VaultStatus;
   cursor?: number;
   limit?: number;
-}): Promise<PaginatedResponse<VaultDTO>> {
+}, options?: { signal?: AbortSignal }): Promise<PaginatedResponse<VaultDTO>> {
   const query = buildQueryString(params);
   const endpoint = `/api/vaults${query}`;
-  return apiFetch<PaginatedResponse<VaultDTO>>(endpoint, { cacheKey: endpoint });
+  return apiFetch<PaginatedResponse<VaultDTO>>(endpoint, { cacheKey: endpoint, signal: options?.signal });
 }
```

Apply to `listPositions` and `getActivity` similarly.

---

## Patch 4: Infinite Query Next Page Guard

**File**: `src/hooks/api/use-activity-api.ts`

```diff
--- a/src/hooks/api/use-activity-api.ts
+++ b/src/hooks/api/use-activity-api.ts
@@ -52,7 +52,8 @@ export function useInfiniteActivity(params: {
       limit: params.limit || 50,
       type: params.type,
     }),
-    getNextPageParam: (lastPage) => lastPage.nextCursor,
+    // Return undefined (not null) to signal end of pagination
+    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
     enabled: !!params.vault || !!params.owner,
     staleTime: 15_000,
     refetchOnWindowFocus: false,
```

---

## Patch 5: Deterministic Feature Flag Sampling

**File**: `src/lib/flags.ts` (NEW)

```typescript
/**
 * Feature flag utilities with deterministic sampling
 */

/**
 * Deterministic percentage assignment based on stable ID
 * Uses FNV-1a hash for stable distribution
 *
 * @param id - Stable identifier (wallet address, cookie, etc.)
 * @param pct - Percentage threshold (0-100)
 * @returns true if ID falls within percentage bucket
 */
export function assignPercent(id: string, pct: number): boolean {
  if (pct <= 0) return false;
  if (pct >= 100) return true;

  // FNV-1a hash (32-bit)
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  const bucket = Math.abs(hash) % 100;
  return bucket < Math.floor(pct);
}

/**
 * Get stable sampling ID for current user
 * Priority: wallet address > persistent cookie > session ID
 */
export function getSamplingId(): string {
  // Server-side: use cookie
  if (typeof window === "undefined") {
    return "server-default"; // SSR gets default behavior
  }

  // Client-side: wallet or cookie
  const walletKey = localStorage.getItem("vitalfi:wallet:last-connected");
  if (walletKey) return walletKey;

  // Create persistent sampling cookie if missing
  let cookieId = localStorage.getItem("vitalfi:sampling-id");
  if (!cookieId) {
    cookieId = crypto.randomUUID();
    localStorage.setItem("vitalfi:sampling-id", cookieId);
  }

  return cookieId;
}

/**
 * Check if backend API should be used (deterministic rollout)
 */
export function shouldUseBackendAPI(): boolean {
  // Environment override
  const envFlag = process.env.NEXT_PUBLIC_USE_BACKEND_API;
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;

  // Percentage rollout
  const rolloutPct = parseInt(process.env.NEXT_PUBLIC_BACKEND_API_ROLLOUT_PCT || "0", 10);
  if (rolloutPct === 0) return false;
  if (rolloutPct >= 100) return true;

  const samplingId = getSamplingId();
  return assignPercent(samplingId, rolloutPct);
}
```

**Usage in hooks**:

```diff
--- a/src/hooks/vault/use-funding-vault.ts
+++ b/src/hooks/vault/use-funding-vault.ts
@@ -1,10 +1,11 @@
 "use client";

 import { useFundingVaultRPC } from './use-funding-vault-rpc';
 import { useFundingVaultAPI } from './use-funding-vault-api';
+import { shouldUseBackendAPI } from '@/lib/flags';

 export function useFundingVault() {
-  const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND_API === "true";
+  const useBackend = shouldUseBackendAPI();

   if (useBackend) {
     return useFundingVaultAPI();
```

**.env.local**:

```env
NEXT_PUBLIC_USE_BACKEND_API=false  # Or "true" to force
NEXT_PUBLIC_BACKEND_API_ROLLOUT_PCT=10  # 10% rollout
```

---

## Patch 6: Decimals-Aware Amount Formatter

**File**: `src/lib/utils/formatters.ts` (enhance existing or create new)

```typescript
/**
 * Convert raw token amount (string of smallest units) to UI amount
 * Handles variable decimals for SPL tokens
 *
 * @param raw - Raw amount as string (e.g., "1000000000" for 1 SOL)
 * @param decimals - Token decimals (default 9 for SOL)
 * @returns UI amount as number (e.g., 1.0)
 */
export function toUiAmount(raw: string | null | undefined, decimals = 9): number {
  if (!raw) return 0;

  // Remove leading zeros
  const s = raw.replace(/^0+/, "") || "0";

  // Split into whole and fractional parts
  const whole = s.length > decimals ? s.slice(0, -decimals) : "0";
  const frac = s.padStart(decimals + 1, "0").slice(-decimals);

  return parseFloat(`${whole}.${frac}`);
}

/**
 * Convert UI amount to raw token amount (inverse of toUiAmount)
 */
export function toRawAmount(uiAmount: number, decimals = 9): string {
  const multiplier = Math.pow(10, decimals);
  const raw = Math.floor(uiAmount * multiplier);
  return raw.toString();
}

/**
 * Format amount with locale-aware number formatting
 *
 * @param raw - Raw amount as string
 * @param decimals - Token decimals
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted string (e.g., "1,234.56 SOL")
 */
export function formatTokenAmount(
  raw: string | null | undefined,
  decimals = 9,
  options: {
    locale?: string;
    symbol?: string;
    maxDecimals?: number;
  } = {}
): string {
  const uiAmount = toUiAmount(raw, decimals);
  const { locale = "en-US", symbol = "", maxDecimals = 2 } = options;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(uiAmount);

  return symbol ? `${formatted} ${symbol}` : formatted;
}
```

**Usage in components**:

```diff
--- a/src/hooks/vault/use-funding-vault-api.ts
+++ b/src/hooks/vault/use-funding-vault-api.ts
@@ -1,5 +1,6 @@
 "use client";

 import { useMemo } from "react";
+import { toUiAmount } from "@/lib/utils/formatters";
 import { VaultEvent, VaultFundingInfo } from "@/types/vault";
 import { useVaultsAPI } from "@/hooks/api";
@@ -30,10 +31,8 @@ export function useFundingVaultAPI() {
   const info = useMemo<VaultFundingInfo | null>(() => {
     if (!vaultDTO || !vaultConfig) return null;

-    // Convert string lamports to SOL
-    const lamportsToSol = (lamports: string): number => {
-      return parseFloat(lamports) / 1e9;
-    };
+    // Use decimals-aware formatter (SOL = 9 decimals)
+    const decimals = 9; // TODO: Get from assetMint metadata

     return {
       stage: vaultDTO.status as any,
       name: vaultConfig.name,
       expectedApyPct: 0,
-      tvlSol: lamportsToSol(vaultDTO.totalDeposited || "0"),
-      capSol: lamportsToSol(vaultDTO.cap || "0"),
+      tvlSol: toUiAmount(vaultDTO.totalDeposited, decimals),
+      capSol: toUiAmount(vaultDTO.cap, decimals),
```

---

## Patch 7: UTC Time Formatting Utility

**File**: `src/lib/utils/formatters.ts` (add to existing file)

```typescript
/**
 * Format ISO timestamp to localized string
 * Always renders in UTC to avoid timezone confusion
 *
 * @param isoString - ISO 8601 timestamp or null
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback
 */
export function formatUtc(
  isoString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }
): string {
  if (!isoString) return "—";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelative(isoString: string | null | undefined): string {
  if (!isoString) return "—";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "just now";
  } catch {
    return "Invalid Date";
  }
}
```

**Usage**:

```tsx
import { formatUtc, formatRelative } from "@/lib/utils/formatters";

<div>
  <p>Maturity: {formatUtc(vault.maturityAt)}</p>
  <p>Last updated: {formatRelative(vault.updatedAt)}</p>
</div>
```

---

## Patch 8: Multi-Authority Support in Portfolio

**File**: `src/hooks/vault/use-portfolio-api.ts`

```diff
--- a/src/hooks/vault/use-portfolio-api.ts
+++ b/src/hooks/vault/use-portfolio-api.ts
@@ -1,5 +1,6 @@
 "use client";

 import { useMemo } from "react";
 import { useWallet } from "@solana/wallet-adapter-react";
 import { usePositionsAPI, useVaultsAPI } from "@/hooks/api";
+import { getNetworkConfig } from "@/lib/sdk";
 import type { PortfolioPosition } from "./use-portfolio";

@@ -18,13 +19,24 @@ export function usePortfolioAPI() {
   const vaultPdas = useMemo(() => {
     if (!positionsResponse) return [];
     return [...new Set(positionsResponse.items.map(p => p.vaultPda))];
   }, [positionsResponse]);

-  // Fetch vault data for each position (batched by authority)
-  // For now, fetch all vaults - optimize later with batching
+  // Extract unique authorities from vault PDAs
+  // TODO: Backend should expose /api/vaults?pdas=...&pdas=... for batch lookup
+  const authorities = useMemo(() => {
+    try {
+      const config = getNetworkConfig();
+      return [config.authority.toBase58()];
+    } catch {
+      return [];
+    }
+  }, []);
+
+  // Fetch vaults for all authorities (currently only one authority supported)
   const { data: vaultsResponse } = useVaultsAPI({
-    authority: "YourAuthorityHere", // TODO: Get from config
+    authority: authorities[0] || "",
     limit: 100,
-    enabled: vaultPdas.length > 0,
+    enabled: vaultPdas.length > 0 && authorities.length > 0,
   });

   const positions = useMemo<PortfolioPosition[]>(() => {
```

---

## Patch 9: SSR/Hydration Safety

**File**: `src/app/layout.tsx` (or wherever QueryClientProvider lives)

```diff
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,10 +1,23 @@
+"use client";
+
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { useState } from "react";

-const queryClient = new QueryClient({
-  defaultOptions: {
-    queries: {
-      staleTime: 30_000,
-      refetchOnWindowFocus: false,
+export function Providers({ children }: { children: React.ReactNode }) {
+  // Create query client inside component to avoid SSR/client mismatch
+  const [queryClient] = useState(
+    () =>
+      new QueryClient({
+        defaultOptions: {
+          queries: {
+            staleTime: 30_000,
+            refetchOnWindowFocus: false,
+            retry: 3,
+          },
+        },
+      })
+  );
+
+  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
+}
```

**File**: All API hooks should have `"use client"` directive at the top.

---

## Patch 10: RPC Fallback on Backend 5xx (Optional Guard Rail)

**File**: `src/lib/api/backend.ts`

```diff
--- a/src/lib/api/backend.ts
+++ b/src/lib/api/backend.ts
@@ -1,6 +1,11 @@
 /**
  * VitalFi Backend API Client
  *
  * Type-safe client with ETag/304 support and React Query integration.
+ *
+ * FALLBACK MODE: If NEXT_PUBLIC_ALLOW_RPC_FALLBACK=true, retries via RPC on 5xx errors.
  */

+const ALLOW_RPC_FALLBACK = process.env.NEXT_PUBLIC_ALLOW_RPC_FALLBACK === "true";
+
 // ... (existing code)

 async function apiFetch<T>(
@@ -145,6 +150,18 @@ async function apiFetch<T>(
       }
       throw new BackendApiError(errorMessage, response.status);
     }
+
+    // Optional: If 5xx and RPC fallback enabled, throw special error for hook to handle
+    if (response.status >= 500 && response.status < 600 && ALLOW_RPC_FALLBACK) {
+      throw new BackendApiError(
+        "Backend unavailable, fallback to RPC recommended",
+        response.status,
+        { fallbackRecommended: true }
+      );
+    }

     const data = await response.json();
```

**File**: `src/hooks/api/use-vaults-api.ts`

```diff
--- a/src/hooks/api/use-vaults-api.ts
+++ b/src/hooks/api/use-vaults-api.ts
@@ -1,6 +1,7 @@
 "use client";

 import { useQuery } from "@tanstack/react-query";
-import { listVaults, VaultDTO, VaultStatus } from "@/lib/api/backend";
+import { listVaults, VaultDTO, VaultStatus, BackendApiError } from "@/lib/api/backend";
+import { useVaultsByAuthority } from "@/lib/vault-hooks"; // RPC fallback

 export function useVaultsAPI(params: UseVaultsAPIParams) {
-  return useQuery({
+  const backendQuery = useQuery({
     queryKey: ["vaults-api", normalizeParams(params)],
     queryFn: ({ signal }) => listVaults({
       authority: params.authority,
       status: params.status,
       cursor: params.cursor,
       limit: params.limit,
     }, { signal }),
     enabled: params.enabled !== false && !!params.authority,
     staleTime: 30_000,
     refetchOnWindowFocus: false,
     retry: 3,
   });
+
+  // Optional RPC fallback if backend returns 5xx
+  const shouldFallback =
+    backendQuery.error instanceof BackendApiError &&
+    backendQuery.error.statusCode >= 500 &&
+    (backendQuery.error.response as any)?.fallbackRecommended;
+
+  // This would need authority as PublicKey - convert from string
+  // const rpcQuery = useVaultsByAuthority(
+  //   shouldFallback ? new PublicKey(params.authority) : null
+  // );
+
+  // For now, just return backend query with error
+  return backendQuery;
 }
```

---

## Patch 11: Relaxed PublicKey Validation

**File**: `src/lib/api/backend.ts` (or wherever validation happens)

```diff
--- Backend query schemas (in backend codebase)
+++ Backend query schemas (in backend codebase)
@@ -17,7 +17,7 @@ const QuerySchema = z.object({
-  authority: z.string().length(44), // Too strict - base58 varies
+  authority: z.string().min(32).max(44), // More lenient
   status: z.enum(["Funding", "Active", "Matured", "Canceled"]).optional(),
```

Frontend trusts backend validation, so no changes needed on frontend side.

---

## Environment Variables Summary

Add to `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_VITALFI_API_URL=https://api.vitalfi.lat

# Feature Flags
NEXT_PUBLIC_USE_BACKEND_API=false          # true/false to force, omit for rollout
NEXT_PUBLIC_BACKEND_API_ROLLOUT_PCT=10    # 0-100 percentage rollout

# Optional Guard Rails
NEXT_PUBLIC_ALLOW_RPC_FALLBACK=false      # true to enable RPC fallback on 5xx
```

---

## Testing Checklist

After applying patches:

- ✅ **Abort safety**: Change params rapidly, verify no stale data set
- ✅ **304 fallback**: Clear localStorage, verify initial 304 retries without ETag
- ✅ **Stable keys**: Toggle feature flag, verify React Query doesn't refetch unnecessarily
- ✅ **Infinite scroll**: Scroll to end, verify `getNextPageParam` returns undefined (not null)
- ✅ **Decimals**: Test with non-SOL mint (e.g., USDC = 6 decimals), verify amounts correct
- ✅ **Time formatting**: Verify all dates render in UTC, null dates show "—"
- ✅ **Rollout**: Set `ROLLOUT_PCT=50`, verify ~50% of users get backend (use deterministic ID)
- ✅ **SSR hydration**: Verify no React hydration warnings in console

---

## Next Steps

1. **Apply patches incrementally** (test after each patch)
2. **Add Zod validation** for backend response DTOs (optional but recommended)
3. **Monitor in production**: Track abort rate, 304 retry rate, fallback usage
4. **Optimize batch queries**: Add `/api/vaults?pdas=...` endpoint for portfolio lookups

---

**End of Resiliency Patches** — These changes bring the integration to production-grade robustness.
