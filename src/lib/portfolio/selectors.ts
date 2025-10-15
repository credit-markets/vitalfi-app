import type { PortfolioPosition } from "@/hooks/usePortfolio";
import { daysUntil } from "@/lib/utils";

/**
 * Get the next upcoming maturity across all positions
 */
export function getNextMaturity(positions: PortfolioPosition[]) {
  const activePositions = positions.filter(p => p.stage !== 'Matured');

  if (activePositions.length === 0) {
    return null;
  }

  // Find nearest maturity date
  const sorted = [...activePositions].sort((a, b) =>
    new Date(a.maturityAt).getTime() - new Date(b.maturityAt).getTime()
  );

  const nearest = sorted[0];
  return {
    date: nearest.maturityAt,
    daysAway: daysUntil(nearest.maturityAt),
    vaultName: nearest.vaultName,
  };
}

/**
 * Get stage breakdown percentages (optimized with single-pass reduce)
 */
export function getStageBreakdown(positions: PortfolioPosition[]) {
  if (positions.length === 0) {
    return { fundingPct: 0, fundedPct: 0, maturedPct: 0 };
  }

  const counts = positions.reduce(
    (acc, p) => {
      if (p.stage === 'Funding') acc.funding++;
      else if (p.stage === 'Funded') acc.funded++;
      else if (p.stage === 'Matured') acc.matured++;
      return acc;
    },
    { funding: 0, funded: 0, matured: 0 }
  );

  const total = positions.length;

  return {
    fundingPct: Math.round((counts.funding / total) * 100),
    fundedPct: Math.round((counts.funded / total) * 100),
    maturedPct: Math.round((counts.matured / total) * 100),
  };
}

/**
 * Get upcoming timeline events (Funding End & Maturity) sorted chronologically
 */
export function getUpcomingEvents(positions: PortfolioPosition[]) {
  const events: Array<{
    id: string;
    type: 'FUNDING_END' | 'MATURITY';
    date: string;
    vaultId: string;
    vaultName: string;
    daysAway: number;
  }> = [];

  positions.forEach(position => {
    // Add funding end event if stage is Funding
    if (position.stage === 'Funding' && position.fundingEndAt) {
      events.push({
        id: `${position.vaultId}-funding-end`,
        type: 'FUNDING_END',
        date: position.fundingEndAt,
        vaultId: position.vaultId,
        vaultName: position.vaultName,
        daysAway: daysUntil(position.fundingEndAt),
      });
    }

    // Add maturity event if not yet matured
    if (position.stage !== 'Matured') {
      events.push({
        id: `${position.vaultId}-maturity`,
        type: 'MATURITY',
        date: position.maturityAt,
        vaultId: position.vaultId,
        vaultName: position.vaultName,
        daysAway: daysUntil(position.maturityAt),
      });
    }
  });

  // Sort chronologically (soonest first)
  return events.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
