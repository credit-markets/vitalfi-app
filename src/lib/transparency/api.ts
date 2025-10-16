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
  const data = await getMockVaultTransparency(vaultId);
  if (!data) {
    throw new Error(`Vault "${vaultId}" not found. Please check the vault ID and try again.`);
  }
  return data;
}

/**
 * Export filtered receivables to CSV
 */
export async function exportReceivablesCsv(
  vaultId: string,
  receivables: Receivable[]
): Promise<Blob> {
  if (!receivables || receivables.length === 0) {
    throw new Error('No receivables available to export. Please adjust your filters or search criteria.');
  }
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
    const statusFilter = filters.status;
    filtered = filtered.filter(r => statusFilter.includes(r.status));
  }

  // Originator filter
  if (filters.originator && filters.originator.length > 0) {
    const originatorFilter = filters.originator;
    filtered = filtered.filter(r => originatorFilter.includes(r.originator));
  }

  // Payer filter
  if (filters.payer && filters.payer.length > 0) {
    const payerFilter = filters.payer;
    filtered = filtered.filter(r => payerFilter.includes(r.payer));
  }

  // Date range filter (by maturity date)
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      if (!isNaN(startDate.getTime())) {
        filtered = filtered.filter(r => {
          const maturityDate = new Date(r.maturityDate);
          return !isNaN(maturityDate.getTime()) && maturityDate >= startDate;
        });
      }
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      if (!isNaN(endDate.getTime())) {
        filtered = filtered.filter(r => {
          const maturityDate = new Date(r.maturityDate);
          return !isNaN(maturityDate.getTime()) && maturityDate <= endDate;
        });
      }
    }
  }

  return filtered;
}

