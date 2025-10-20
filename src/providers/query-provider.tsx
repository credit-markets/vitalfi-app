"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * React Query Provider for the application
 *
 * Provides React Query client to all components.
 * Creates a new client instance per component tree to avoid state sharing.
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a client per component tree to avoid cross-request state pollution
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Retry failed requests
            retry: 1,
            // Stale time: 30 seconds default
            staleTime: 30000,
            // Cache time: 5 minutes
            gcTime: 5 * 60 * 1000,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
