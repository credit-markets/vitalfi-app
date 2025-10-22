/**
 * Backend API Hooks
 *
 * React Query hooks for fetching data from the VitalFi backend API.
 *
 * API-backed hooks (with ETag/304 caching, abort signals, and retry logic):
 * - useVaultsAPI, usePositionsAPI, useActivityAPI, useInfiniteActivity
 */

// Backend API hooks with ETag/304 caching
export * from "./use-vaults-api";
export * from "./use-positions-api";
export * from "./use-activity-api";
