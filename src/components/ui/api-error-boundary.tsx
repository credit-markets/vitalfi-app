"use client";

import { BackendApiError } from "@/lib/api/backend";
import { Button } from "./button";

export interface ApiErrorBoundaryProps {
  error: Error;
  retry: () => void;
  fallbackToRPC?: () => void;
}

/**
 * Error boundary for backend API errors
 *
 * Provides user-friendly error messages and retry/fallback options.
 */
export function ApiErrorBoundary({
  error,
  retry,
  fallbackToRPC,
}: ApiErrorBoundaryProps) {
  // Handle backend API errors
  if (error instanceof BackendApiError) {
    // 5xx errors: Backend temporarily unavailable
    if (error.statusCode >= 500) {
      return (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div
            id="error-title-500"
            className="text-xl font-semibold text-foreground"
          >
            Backend temporarily unavailable
          </div>
          <p
            aria-describedby="error-title-500"
            className="text-sm text-muted-foreground max-w-md"
          >
            We&apos;re experiencing technical difficulties. Please try again in a few moments.
          </p>
          <div className="flex gap-2">
            <Button onClick={retry} aria-label="Retry request">
              Retry
            </Button>
            {fallbackToRPC && (
              <Button
                variant="outline"
                onClick={fallbackToRPC}
                aria-label="Use direct RPC connection as fallback"
              >
                Use Direct Connection (Slower)
              </Button>
            )}
          </div>
        </div>
      );
    }

    // 404 errors: No data found
    if (error.statusCode === 404) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div
            id="error-title-404"
            className="text-lg font-medium text-muted-foreground"
          >
            No data found
          </div>
          <p
            aria-describedby="error-title-404"
            className="text-sm text-muted-foreground"
          >
            The requested data could not be found.
          </p>
        </div>
      );
    }

    // 401/403 errors: Authentication/Authorization
    if (error.statusCode === 401 || error.statusCode === 403) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div
            id="error-title-auth"
            className="text-lg font-medium text-destructive"
          >
            Access Denied
          </div>
          <p
            aria-describedby="error-title-auth"
            className="text-sm text-muted-foreground max-w-md"
          >
            You don&apos;t have permission to access this resource.
          </p>
        </div>
      );
    }
  }

  // Generic errors
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div
        id="error-title-generic"
        className="text-xl font-semibold text-destructive"
      >
        Something went wrong
      </div>
      <p
        aria-describedby="error-title-generic"
        className="text-sm text-muted-foreground max-w-md"
      >
        {error.message || "An unexpected error occurred"}
      </p>
      <Button onClick={retry} aria-label="Try request again">
        Try Again
      </Button>
    </div>
  );
}
