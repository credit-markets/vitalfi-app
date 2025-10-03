"use client";

import { useState } from "react";
import { getMockVaultEvents } from "@/lib/solana/mock-data";
import type { EventTag } from "@/types/vault";

export interface VaultEventsParams {
  tag?: EventTag | "All";
  limit?: number;
}

/**
 * Hook to fetch and filter vault events for the transactions table
 * Supports filtering by event tag and limiting results
 */
export function useVaultEvents(params?: VaultEventsParams) {
  const [events] = useState(() => {
    let allEvents = getMockVaultEvents();

    // Filter by tag if specified
    if (params?.tag && params.tag !== "All") {
      allEvents = allEvents.filter((e) => e.tag === params.tag);
    }

    // Limit results if specified
    if (params?.limit) {
      allEvents = allEvents.slice(0, params.limit);
    }

    return allEvents;
  });

  return { events };
}
