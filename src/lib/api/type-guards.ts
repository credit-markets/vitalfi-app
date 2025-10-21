/**
 * Type Guards for Backend API
 *
 * Shared type guard functions to avoid code duplication and maintain consistency.
 */

import { BackendApiError } from "./backend";

/**
 * Type guard for errors with statusCode property
 *
 * Used to safely check if an error has a statusCode before accessing it.
 *
 * @param error - Unknown error object
 * @returns true if error has numeric statusCode property
 */
export function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  );
}

/**
 * Type guard for BackendApiError instances
 *
 * @param error - Unknown error object
 * @returns true if error is BackendApiError instance
 */
export function isBackendApiError(error: unknown): error is BackendApiError {
  return error instanceof BackendApiError;
}

/**
 * Type guard for network errors (no statusCode)
 *
 * @param error - Unknown error object
 * @returns true if error appears to be a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // Common network error names
    const networkErrorNames = [
      "NetworkError",
      "TypeError", // fetch throws TypeError for network issues
      "AbortError",
    ];
    return networkErrorNames.includes(error.name);
  }
  return false;
}

/**
 * Type guard for client errors (4xx status codes)
 *
 * @param error - Unknown error object
 * @returns true if error has 4xx status code
 */
export function isClientError(error: unknown): boolean {
  return (
    hasStatusCode(error) &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

/**
 * Type guard for server errors (5xx status codes)
 *
 * @param error - Unknown error object
 * @returns true if error has 5xx status code
 */
export function isServerError(error: unknown): boolean {
  return (
    hasStatusCode(error) &&
    error.statusCode >= 500 &&
    error.statusCode < 600
  );
}
