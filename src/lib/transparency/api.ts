import type { VaultSummary, VaultTransparencyData, Receivable, ReceivableFilters } from "@/types/vault";
import {
  getMockTransparencyVaults,
  getMockVaultTransparency,
  exportReceivablesCsv as mockExportCsv,
} from "./mock";

/**
 * List all transparency vaults (Funded/Matured only)
 * Funding vaults are excluded
 */
export async function listTransparencyVaults(): Promise<VaultSummary[]> {
  // In production, this would fetch from API/chain
  // For now, return mock data filtered to Funded/Matured only
  const vaults = getMockTransparencyVaults();
  return vaults.filter(v => v.stage === 'Funded' || v.stage === 'Matured');
}

/**
 * Get full transparency data for a specific vault
 */
export async function getVaultTransparency(vaultId: string): Promise<VaultTransparencyData> {
  // In production, this would fetch from API/chain
  return getMockVaultTransparency(vaultId);
}

/**
 * Export filtered receivables to CSV
 */
export async function exportReceivablesCsv(
  vaultId: string,
  receivables: Receivable[]
): Promise<Blob> {
  // In production, this might call a backend endpoint for server-side CSV generation
  return mockExportCsv(vaultId, receivables);
}

/**
 * Apply filters to receivables list (client-side)
 */
export function filterReceivables(
  receivables: Receivable[],
  filters: ReceivableFilters
): Receivable[] {
  let filtered = [...receivables];

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(r => filters.status!.includes(r.status));
  }

  // Originator filter
  if (filters.originator && filters.originator.length > 0) {
    filtered = filtered.filter(r => filters.originator!.includes(r.originator));
  }

  // Payer filter
  if (filters.payer && filters.payer.length > 0) {
    filtered = filtered.filter(r => filters.payer!.includes(r.payer));
  }

  // Date range filter (by maturity date)
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(r => new Date(r.maturityDate) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(r => new Date(r.maturityDate) <= endDate);
    }
  }

  return filtered;
}

/**
 * Get unique values for filter dropdowns
 */
export function getFilterOptions(receivables: Receivable[]): {
  originators: string[];
  payers: string[];
} {
  const originators = Array.from(new Set(receivables.map(r => r.originator))).sort();
  const payers = Array.from(new Set(receivables.map(r => r.payer))).sort();

  return { originators, payers };
}
