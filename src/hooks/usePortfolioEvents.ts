"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getMockPortfolioEvents } from "@/lib/solana/mock-data";
import type { PortfolioEvent, PortfolioEventTag } from "@/types/vault";

export interface PortfolioEventsFilters {
  tag?: PortfolioEventTag | "All";
}

/**
 * Hook to fetch user's portfolio events (deposits, withdrawals, claims)
 * Supports filtering by event tag
 */
export function usePortfolioEvents(filters?: PortfolioEventsFilters) {
  const { publicKey, connected } = useWallet();

  const [events] = useState(() => {
    if (!connected || !publicKey) {
      return [];
    }

    let allEvents = getMockPortfolioEvents(publicKey.toBase58());

    // Filter by tag if specified
    if (filters?.tag && filters.tag !== "All") {
      allEvents = allEvents.filter((e) => e.tag === filters.tag);
    }

    return allEvents;
  });

  return { events };
}
