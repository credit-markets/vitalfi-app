import type { LegacyVaultEvent } from "@/types/vault";

export type Point = { t: string; pps: number };
export type ApyPoint = { t: string; apy: number };

/**
 * Derive assets, supply, price per share, and APY from event stream
 * This implements the single-token accrual model where:
 * - Deposits add both assets and shares
 * - Claims remove both assets and shares
 * - Repayments add assets (increasing PPS)
 * - WithdrawRequests don't affect balances (queue only)
 */
export function deriveFromEvents(events: LegacyVaultEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  let assets = 0;
  let supply = 0;
  const pps: Point[] = [];

  for (const ev of sorted) {
    if (ev.tag === "Deposit") {
      assets += ev.amountSol ?? 0;
      supply += ev.shares ?? 0;
    } else if (ev.tag === "Claim") {
      assets -= Math.abs(ev.amountSol ?? 0);
      supply -= Math.abs(ev.shares ?? 0);
    } else if (ev.tag === "Repayment") {
      assets += ev.amountSol ?? 0;
      // supply unchanged
    }
    // WithdrawRequest: no change to assets or supply

    const pricePerShare = supply > 0 ? assets / supply : 0;
    pps.push({ t: ev.ts, pps: pricePerShare });
  }

  // Rolling APR approximation over last 30 events (proxy for 30 days)
  // APR ≈ (pps_now / pps_30_events_ago - 1) * (365/30)
  const apySeries: ApyPoint[] = pps.map((pt, i) => {
    const lookbackIdx = Math.max(0, i - 30);
    const base = pps[lookbackIdx].pps || 0;
    const apr = base > 0 ? ((pt.pps / base - 1) * 365) / 30 : 0;
    return { t: pt.t, apy: apr * 100 }; // convert to percentage
  });

  return { seriesPps: pps, seriesApy: apySeries };
}
