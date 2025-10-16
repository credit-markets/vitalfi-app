import type { VaultSummary, VaultTransparencyData, Receivable, ReceivableFilters } from "@/types/vault";
import {
  getMockTransparencyVaults,
  getMockVaultTransparency,
  exportReceivablesCsv as mockExportCsv,
} from "./mock";

/**
 * List all vaults (all stages)
 */
export async function listTransparencyVaults(): Promise<VaultSummary[]> {
  // In production, this would fetch from API/chain
  const vaults = getMockTransparencyVaults();
  return vaults;
}

/**
 * Get full transparency data for a specific vault
 */
export async function getVaultTransparency(vaultId: string): Promise<VaultTransparencyData> {
  // Validate vaultId parameter
  if (!vaultId || typeof vaultId !== 'string' || vaultId.trim() === '') {
    throw new Error('Invalid vault ID provided');
  }

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
 * Helper function to filter items by field with type-safe array checking
 */
function filterByField<T, K extends keyof T>(
  items: T[],
  field: K,
  values: T[K][] | undefined
): T[] {
  if (!values || values.length === 0) return items;
  return items.filter(item => values.includes(item[field]));
}

/**
 * Apply filters to receivables list (client-side)
 */
export function filterReceivables(
  receivables: Receivable[],
  filters: ReceivableFilters
): Receivable[] {
  let filtered = [...receivables];

  // Apply field-based filters
  filtered = filterByField(filtered, 'status', filters.status);
  filtered = filterByField(filtered, 'originator', filters.originator);
  filtered = filterByField(filtered, 'payer', filters.payer);

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

