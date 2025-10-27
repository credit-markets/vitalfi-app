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

/**
 * Helper to calculate days to/past maturity
 */
function calculateDays(maturityDate: string): { daysToMaturity?: number; daysPastDue?: number } {
  const now = new Date();
  const maturity = new Date(maturityDate);

  if (isNaN(maturity.getTime())) {
    console.warn('Invalid maturity date detected', { maturityDate });
    return {};
  }

  const diffMs = maturity.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return { daysToMaturity: diffDays };
  } else {
    return { daysPastDue: Math.abs(diffDays) };
  }
}

/**
 * Generate realistic receivables for mock data
 */
function generateReceivables(count: number, baseDate: Date, status: ReceivableStatus): Receivable[] {
  const receivables: Receivable[] = [];
  const payers = [
    "SUS - Sistema Único de Saúde",
    "Unimed São Paulo",
    "Bradesco Saúde",
    "Amil Assistência Médica",
    "Sul América Seguros",
    "Golden Cross",
  ];

  for (let i = 0; i < count; i++) {
    const faceValue = 1000 + Math.random() * 9000; // 1k-10k SOL equivalent
    const advancePct = 0.75 + Math.random() * 0.15; // 75-90% advance rate
    const costBasis = faceValue * advancePct;
    const issueDate = new Date(baseDate);
    issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60)); // 0-60 days ago
    const maturityDate = new Date(issueDate);
    maturityDate.setDate(maturityDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 30-90 day terms

    const originator = Math.random() > 0.5 ? "Saúde+ Clínica" : "VidaMed Hospital";
    const payer = payers[Math.floor(Math.random() * payers.length)];

    receivables.push({
      id: `INV-${(i + 1).toString().padStart(4, '0')}`,
      originator,
      payer,
      currency: 'BRL',
      faceValue: parseFloat(faceValue.toFixed(2)),
      costBasis: parseFloat(costBasis.toFixed(2)),
      advancePct: parseFloat(advancePct.toFixed(4)),
      expectedRepayment: parseFloat(faceValue.toFixed(2)),
      issueDate: issueDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      ...calculateDays(maturityDate.toISOString()),
      status,
      links: {
        invoiceUrl: `https://docs.vitalfi.io/invoices/INV-${i + 1}.pdf`,
        assignmentUrl: `https://docs.vitalfi.io/assignments/ASG-${i + 1}.pdf`,
        txUrl: `https://solscan.io/tx/${Math.random().toString(36).substring(2, 15)}`,
      },
      notes: status === 'Disputed' ? 'Payment delayed due to administrative review' : undefined,
    });
  }

  return receivables;
}

/**
 * Calculate analytics from receivables
 */
function calculateAnalytics(receivables: Receivable[]): CollateralAnalytics {
  const faceValueTotal = receivables.reduce((sum, r) => sum + r.faceValue, 0);
  const costBasisTotal = receivables.reduce((sum, r) => sum + r.costBasis, 0);
  const outstandingTotal = receivables.filter(r => r.status === 'Performing' || r.status === 'Matured').reduce((sum, r) => sum + r.expectedRepayment, 0);

  // Calculate WAL (weighted average life)
  const totalNotional = receivables.reduce((sum, r) => sum + r.faceValue, 0);
  const weightedDays = receivables.reduce((sum, r) => {
    const days = r.daysToMaturity || 0;
    return sum + (r.faceValue / totalNotional) * days;
  }, 0);

  // Top originator concentration
  const originatorTotals: Record<string, number> = {};
  receivables.forEach(r => {
    originatorTotals[r.originator] = (originatorTotals[r.originator] || 0) + r.faceValue;
  });
  const originatorValues = Object.values(originatorTotals);
  const topOriginatorPct = originatorValues.length > 0 && faceValueTotal > 0
    ? Math.max(...originatorValues) / faceValueTotal
    : 0;

  // Top payer concentration
  const payerTotals: Record<string, number> = {};
  receivables.forEach(r => {
    payerTotals[r.payer] = (payerTotals[r.payer] || 0) + r.faceValue;
  });
  const payerValues = Object.values(payerTotals);
  const topPayerPct = payerValues.length > 0 && faceValueTotal > 0
    ? Math.max(...payerValues) / faceValueTotal
    : 0;

  return {
    receivableCount: receivables.length,
    faceValueTotal: parseFloat(faceValueTotal.toFixed(2)),
    costBasisTotal: parseFloat(costBasisTotal.toFixed(2)),
    outstandingTotal: parseFloat(outstandingTotal.toFixed(2)),
    weightedAvgLifeDays: Math.round(weightedDays),
    topOriginatorPct: parseFloat(topOriginatorPct.toFixed(4)),
    topPayerPct: parseFloat(topPayerPct.toFixed(4)),
  };
}

/**
 * Generate mock transparency data for any vault based on its status
 *
 * This is a fallback used when the backend endpoint is not yet available.
 * Once the backend is ready, this will no longer be called.
 */
export function generateMockTransparencyData(
  vaultStatus: string,
  vaultRaised: number,
  vaultMaturityDate: string
) {
  const baseDate = new Date();
  let receivables: Receivable[];

  // Generate receivables based on vault status
  if (vaultStatus === "Active" || vaultStatus === "Funding") {
    // Active/Funding vault: mostly performing, some matured
    receivables = [
      ...generateReceivables(35, baseDate, 'Performing'),
      ...generateReceivables(8, baseDate, 'Matured'),
    ];
  } else if (vaultStatus === "Matured") {
    // Matured vault: mostly repaid, some still outstanding
    receivables = [
      ...generateReceivables(25, baseDate, 'Repaid'),
      ...generateReceivables(5, baseDate, 'Matured'),
    ];
  } else {
    // Canceled/Closed: no receivables
    receivables = [];
  }

  const analytics = calculateAnalytics(receivables);

  // Hedge (only for Active/Funding vaults with exposure)
  const fundingStart = new Date();
  fundingStart.setDate(fundingStart.getDate() - 60); // started 60 days ago

  const hedge: HedgePosition | undefined = (vaultStatus === "Active" || vaultStatus === "Funding") ? {
    coveragePct: 0.85,
    instrument: 'NDF',
    pair: 'USD/BRL',
    notional: vaultRaised * 0.85,
    tenorStart: fundingStart.toISOString(),
    tenorEnd: vaultMaturityDate,
    referenceRate: 'PTAX',
    mtm: -2500, // negative MTM (hedge cost)
    realizedPnL: 0,
    counterparty: 'Itaú BBA',
    venue: 'B3',
    basisNote: 'Small basis risk exists between medical receivable maturities and NDF settlement dates',
  } : undefined;

  // Documents
  const documents: VaultDocuments = {
    files: [
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
    ],
  };

  if (hedge) {
    documents.files.push({
      id: 'doc-6',
      name: 'Hedge Confirmation.pdf',
      type: 'pdf' as const,
      url: `https://docs.vitalfi.io/hedge-confirmation.pdf`,
      uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return {
    collateral: {
      analytics,
      items: receivables,
    },
    hedge,
    documents,
  };
}
