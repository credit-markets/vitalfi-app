/**
 * Type Guards for Backend API
 *
 * Shared type guard functions to avoid code duplication and maintain consistency.
 */

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
