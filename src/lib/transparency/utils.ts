/**
 * Transparency utilities and mock data generators
 *
 * This file contains all utilities for the transparency feature including:
 * - Receivable filtering
 * - CSV export
 * - Mock data generation (until backend is ready)
 */

import type {
  Receivable,
  ReceivableFilters,
  ReceivableStatus,
  CollateralAnalytics,
  HedgePosition,
  VaultDocuments,
} from "@/types/vault";

// ============================================================================
// Client-side Filtering Utilities
// ============================================================================

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

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export filtered receivables to CSV
 */
export function exportReceivablesCsv(
  _vaultPda: string,
  receivables: Receivable[]
): Blob {
  if (!receivables || receivables.length === 0) {
    throw new Error('No receivables available to export. Please adjust your filters or search criteria.');
  }

  const headers = [
    'ID',
    'Originator',
    'Payer',
    'Currency',
    'Face Value',
    'Cost Basis',
    'Advance %',
    'Expected Repayment',
    'Issue Date',
    'Maturity Date',
    'Days to Maturity',
    'Days Past Due',
    'Status',
    'Invoice URL',
    'Assignment URL',
    'Tx URL',
  ];

  const rows = receivables.map(r => [
    r.id,
    r.originator,
    r.payer,
    r.currency,
    r.faceValue.toString(),
    r.costBasis.toString(),
    (r.advancePct * 100).toFixed(2) + '%',
    r.expectedRepayment.toString(),
    r.issueDate || '',
    r.maturityDate,
    r.daysToMaturity?.toString() || '',
    r.daysPastDue?.toString() || '',
    r.status,
    r.links?.invoiceUrl || '',
    r.links?.assignmentUrl || '',
    r.links?.txUrl || '',
  ]);

  // Sanitize cells to prevent CSV injection
  const sanitizeCell = (value: string | number): string => {
    let str = String(value);

    // Escape double quotes by doubling them (RFC 4180)
    str = str.replace(/"/g, '""');

    // Remove null bytes, tabs, and newlines for safety
    str = str.replace(/[\0\t\n\r]/g, ' ');

    // If cell starts with formula characters, prefix with single quote
    if (str.match(/^[=+\-@]/)) {
      str = `'${str}`;
    }

    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${sanitizeCell(cell)}"`).join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// ============================================================================
// Mock Data Generation (Fallback until backend is ready)
// ============================================================================

const NOW_MS = Date.now();
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Cache static documents to avoid recreating on every call
const BASE_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Term Sheet.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/term-sheet.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-2',
    name: 'Collateral Schedule.csv',
    type: 'csv' as const,
    url: `https://docs.vitalfi.io/collateral.csv`,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-3',
    name: 'Purchase Agreement.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/purchase-agreement.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-4',
    name: 'Servicing Agreement.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/servicing.pdf`,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-5',
    name: 'Monthly Report - Current.pdf',
    type: 'pdf' as const,
    url: `https://docs.vitalfi.io/report-current.pdf`,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const HEDGE_DOCUMENT = {
  id: 'doc-6',
  name: 'Hedge Confirmation.pdf',
  type: 'pdf' as const,
  url: `https://docs.vitalfi.io/hedge-confirmation.pdf`,
  uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
};

// Pre-computed static template for 15 receivables (computed once at module load)
// This avoids expensive date calculations on every call
const RECEIVABLE_TEMPLATE = (() => {
  const baseDate = NOW_MS;

  const payers = [
    "SUS - Sistema Único de Saúde",
    "Unimed São Paulo",
    "Bradesco Saúde",
    "Amil Assistência Médica",
    "Sul América Seguros",
    "Golden Cross",
  ];

  const originators = [
    "Saúde+ Clínica",
    "VidaMed Hospital",
    "Hospital São Lucas",
  ];

  const sizeDistribution = [
    0.15, 0.12, 0.10, 0.09, 0.08,
    0.07, 0.06, 0.06, 0.05, 0.05,
    0.04, 0.04, 0.03, 0.03, 0.03
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const issueDate = baseDate - ((15 + i * 3) * MS_PER_DAY);
    const maturityDate = issueDate + ((45 + i * 4) * MS_PER_DAY);

    return {
      id: `INV-${1001 + i}`,
      originator: originators[i % originators.length],
      payer: payers[i % payers.length],
      currency: 'BRL' as const,
      sizeRatio: sizeDistribution[i],
      advancePct: 0.75 + (i % 5) * 0.03,
      issueDate: new Date(issueDate).toISOString(),
      maturityDate: new Date(maturityDate).toISOString(),
      maturityDays: Math.floor((maturityDate - NOW_MS) / MS_PER_DAY),
      links: {
        invoiceUrl: `https://docs.vitalfi.io/invoices/INV-${1001 + i}.pdf`,
        assignmentUrl: `https://docs.vitalfi.io/assignments/ASG-${1001 + i}.pdf`,
        txUrl: `https://solscan.io/tx/mock${(1001 + i).toString(36)}`,
      },
    };
  });
})();

/**
 * Generate fixed 15 mock receivables scaled to vault raised amount
 * Uses pre-computed template for instant generation
 */
function generateFixedReceivables(vaultRaised: number, status: ReceivableStatus): Receivable[] {
  const totalFaceValue = vaultRaised / 0.80;

  return RECEIVABLE_TEMPLATE.map((template) => {
    const faceValue = totalFaceValue * template.sizeRatio;
    const costBasis = faceValue * template.advancePct;

    return {
      id: template.id,
      originator: template.originator,
      payer: template.payer,
      currency: template.currency,
      faceValue: parseFloat(faceValue.toFixed(2)),
      costBasis: parseFloat(costBasis.toFixed(2)),
      advancePct: parseFloat(template.advancePct.toFixed(4)),
      expectedRepayment: parseFloat(faceValue.toFixed(2)),
      issueDate: template.issueDate,
      maturityDate: template.maturityDate,
      daysToMaturity: template.maturityDays >= 0 ? template.maturityDays : undefined,
      daysPastDue: template.maturityDays < 0 ? Math.abs(template.maturityDays) : undefined,
      status,
      links: template.links,
      notes: status === 'Disputed' ? 'Payment delayed due to administrative review' : undefined,
    };
  });
}

/**
 * Calculate analytics from receivables (optimized - single pass)
 */
function calculateAnalytics(receivables: Receivable[]): CollateralAnalytics {
  let faceValueTotal = 0;
  let costBasisTotal = 0;
  let outstandingTotal = 0;
  let weightedDays = 0;
  let maxOriginatorTotal = 0;
  let maxPayerTotal = 0;
  const originatorTotals = new Map<string, number>();
  const payerTotals = new Map<string, number>();

  // Single pass through receivables
  for (const r of receivables) {
    faceValueTotal += r.faceValue;
    costBasisTotal += r.costBasis;

    if (r.status === 'Performing' || r.status === 'Matured') {
      outstandingTotal += r.expectedRepayment;
    }

    // Track concentrations inline
    const originatorTotal = (originatorTotals.get(r.originator) || 0) + r.faceValue;
    originatorTotals.set(r.originator, originatorTotal);
    if (originatorTotal > maxOriginatorTotal) maxOriginatorTotal = originatorTotal;

    const payerTotal = (payerTotals.get(r.payer) || 0) + r.faceValue;
    payerTotals.set(r.payer, payerTotal);
    if (payerTotal > maxPayerTotal) maxPayerTotal = payerTotal;

    // Calculate weighted days inline
    const days = r.daysToMaturity || 0;
    weightedDays += r.faceValue * days;
  }

  return {
    receivableCount: receivables.length,
    faceValueTotal: parseFloat(faceValueTotal.toFixed(2)),
    costBasisTotal: parseFloat(costBasisTotal.toFixed(2)),
    outstandingTotal: parseFloat(outstandingTotal.toFixed(2)),
    weightedAvgLifeDays: faceValueTotal > 0 ? Math.round(weightedDays / faceValueTotal) : 0,
    topOriginatorPct: faceValueTotal > 0 ? parseFloat((maxOriginatorTotal / faceValueTotal).toFixed(4)) : 0,
    topPayerPct: faceValueTotal > 0 ? parseFloat((maxPayerTotal / faceValueTotal).toFixed(4)) : 0,
  };
}

// Cache mock data results by vault parameters to avoid regeneration
const mockDataCache = new Map<string, ReturnType<typeof generateMockTransparencyDataInternal>>();

/**
 * Generate mock transparency data for any vault based on its status
 * Results are cached by vaultStatus + vaultRaised + vaultMaturityDate
 */
export function generateMockTransparencyData(
  vaultStatus: string,
  vaultRaised: number,
  vaultMaturityDate: string
) {
  const cacheKey = `${vaultStatus}:${vaultRaised}:${vaultMaturityDate}`;

  const cached = mockDataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = generateMockTransparencyDataInternal(vaultStatus, vaultRaised, vaultMaturityDate);
  mockDataCache.set(cacheKey, result);

  // Limit cache size to prevent memory leaks (keep last 20 vaults)
  if (mockDataCache.size > 20) {
    const firstKey = mockDataCache.keys().next().value;
    if (firstKey) {
      mockDataCache.delete(firstKey);
    }
  }

  return result;
}

function generateMockTransparencyDataInternal(
  vaultStatus: string,
  vaultRaised: number,
  vaultMaturityDate: string
) {
  let receivables: Receivable[];
  let hedge: HedgePosition | undefined;

  // Only generate fake data for Active and Matured vaults
  // All other statuses (Funding, Canceled, Closed) show empty states
  if (vaultStatus === "Active") {
    // Active vault: all performing receivables
    receivables = generateFixedReceivables(vaultRaised, 'Performing');

    // Active vault has hedge position
    const fundingStart = new Date();
    fundingStart.setDate(fundingStart.getDate() - 60);
    hedge = {
      coveragePct: 0.85,
      instrument: 'NDF',
      pair: 'USD/BRL',
      notional: vaultRaised * 0.85,
      tenorStart: fundingStart.toISOString(),
      tenorEnd: vaultMaturityDate,
      referenceRate: 'PTAX',
      mtm: vaultRaised * -0.02, // -2% of notional as hedge cost
      realizedPnL: 0,
      counterparty: 'Itaú BBA',
      venue: 'B3',
      basisNote: 'Small basis risk exists between medical receivable maturities and NDF settlement dates',
    };
  } else if (vaultStatus === "Matured") {
    // Matured vault: mix of repaid and matured receivables
    const allReceivables = generateFixedReceivables(vaultRaised, 'Performing');
    // Convert 12 to repaid, keep 3 as matured
    receivables = allReceivables.map((r, i) =>
      i < 12 ? { ...r, status: 'Repaid' as ReceivableStatus } : { ...r, status: 'Matured' as ReceivableStatus }
    );

    // Matured vault: hedge is settled/closed, show empty state
    hedge = undefined;
  } else {
    // Funding/Canceled/Closed: empty state (no fake data)
    receivables = [];
    hedge = undefined;
  }

  const analytics = calculateAnalytics(receivables);

  const documents: VaultDocuments = {
    files: hedge ? [...BASE_DOCUMENTS, HEDGE_DOCUMENT] : BASE_DOCUMENTS,
  };

  return {
    collateral: {
      analytics,
      items: receivables,
    },
    hedge,
    documents,
  };
}
