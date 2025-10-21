"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { hasStatusCode } from "@/lib/api/type-guards";

/**
 * React Query Provider for the application
 *
 * Provides React Query client to all components.
 *
 * RESILIENCY FEATURES:
 * - SSR hydration safety (useState for client instantiation)
 * - Optimized for backend API integration
 * - Smart retry logic (5xx only)
 * - Exponential backoff
 * - Reconnect on network restore
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // RESILIENCY PATCH: SSR hydration safety
  // Create a client per component tree to avoid state sharing
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Match backend s-maxage (30s fresh, 60s stale-while-revalidate)
            staleTime: 30_000,
            // Garbage collection time: 5 minutes
            gcTime: 5 * 60 * 1000,
            // Disable automatic refetching on window focus (handled by staleTime)
            refetchOnWindowFocus: false,
            // Reconnect on network restore
            refetchOnReconnect: true,
            // Smart retry logic: only retry on 5xx errors
            retry: (failureCount, error: unknown) => {
              // Don't retry if statusCode is 4xx (client errors)
              if (hasStatusCode(error) && error.statusCode >= 400 && error.statusCode < 500) {
                return false;
              }
              // Retry up to 3 times for 5xx or network errors
              return failureCount < 3;
            },
            // Exponential backoff
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once on network errors only
            retry: (failureCount, error: unknown) => {
              // Only retry network errors, not API errors
              if (hasStatusCode(error)) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
