import { getMockVaultStats, getMockVaultEvents, getMockCollateralSnapshot, getMockParamChanges } from "@/lib/solana/mock-data";
import type { VaultStats, LegacyVaultEvent, CollateralSnapshot, ParamChange, DerivedMetrics, ReconciliationData } from "@/types/vault";

export function deriveFromEvents(events: LegacyVaultEvent[]): DerivedMetrics {
  const sorted = [...events].sort((a, b) => +new Date(a.ts) - +new Date(b.ts));
  let assets = 0;
  let supply = 0;
  const ppsSeries: { t: string; pps: number }[] = [];

  for (const ev of sorted) {
    if (ev.tag === "Deposit") {
      assets += ev.amountSol ?? 0;
      supply += ev.shares ?? 0;
    } else if (ev.tag === "Claim") {
      assets -= ev.amountSol ?? 0;
      supply -= Math.abs(ev.shares ?? 0);
    } else if (ev.tag === "Repayment") {
      assets += ev.amountSol ?? 0;
    }
    const pps = supply > 0 ? assets / supply : 0;
    ppsSeries.push({ t: ev.ts, pps });
  }

  const roll = (windowDays: number) =>
    ppsSeries.map((pt, i) => {
      const j = Math.max(0, i - windowDays);
      const basePps = ppsSeries[j]?.pps ?? 0;
      const apr = basePps > 0 ? ((pt.pps / basePps - 1) * 365) / windowDays : 0;
      return { t: pt.t, apr };
    });

  return {
    ppsSeries,
    apr7d: roll(7),
    apr30d: roll(30),
    assetsNow: assets,
    supplyNow: supply,
    ppsNow: supply > 0 ? assets / supply : 0,
  };
}

export function useTransparency() {
  const stats: VaultStats = getMockVaultStats();
  const snapshot: CollateralSnapshot = getMockCollateralSnapshot();
  const events: LegacyVaultEvent[] = getMockVaultEvents();
  const paramChanges: ParamChange[] = getMockParamChanges();

  const derived = deriveFromEvents(events);
  const reconciliation: ReconciliationData = {
    assetsOnChain: derived.assetsNow,
    supply: derived.supplyNow,
    pps: derived.ppsNow,
    tvl: stats.tvl,
    delta: derived.assetsNow - stats.tvl,
  };

  const lastUpdated = new Date().toISOString();

  return { stats, snapshot, events, paramChanges, derived, reconciliation, lastUpdated };
}
