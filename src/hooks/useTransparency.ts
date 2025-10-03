import { getMockVaultStats, getMockVaultEvents } from "@/lib/solana/mock-data";
import { deriveFromEvents } from "@/lib/derive";
import type { VaultStats, VaultEvent } from "@/types/vault";

export function useTransparency() {
  // Wire to existing mocks
  const stats: VaultStats = getMockVaultStats();
  const events: VaultEvent[] = getMockVaultEvents();

  // Derive PPS and APY from events
  const { seriesPps, seriesApy } = deriveFromEvents(events);

  // Download events as JSON
  const downloadEvents = (filter?: unknown) => {
    const dataStr = JSON.stringify(filter ? events : events, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vault-events-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    stats,
    addresses: stats.addresses,
    events,
    derived: {
      pricePerShareSeries: seriesPps,
      apySeries: seriesApy,
    },
    downloadEvents,
  };
}
