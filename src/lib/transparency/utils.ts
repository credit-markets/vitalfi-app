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

// Cache current time to avoid creating new Date() for each receivable
const NOW_MS = Date.now();
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Helper to calculate days to/past maturity (optimized)
 */
function calculateDays(maturityDate: string): { daysToMaturity?: number; daysPastDue?: number } {
  const maturity = new Date(maturityDate);

  if (isNaN(maturity.getTime())) {
    console.warn('Invalid maturity date detected', { maturityDate });
    return {};
  }

  const diffMs = maturity.getTime() - NOW_MS;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays >= 0) {
    return { daysToMaturity: diffDays };
  } else {
    return { daysPastDue: Math.abs(diffDays) };
  }
}

/**
 * Generate fixed 15 mock receivables scaled to vault raised amount
 * Uses deterministic data for consistency
 */
function generateFixedReceivables(vaultRaised: number, status: ReceivableStatus): Receivable[] {
  const baseDate = new Date();

  // Fixed payer distribution (realistic Brazilian healthcare payers)
  const payers = [
    "SUS - Sistema Único de Saúde",
    "Unimed São Paulo",
    "Bradesco Saúde",
    "Amil Assistência Médica",
    "Sul América Seguros",
    "Golden Cross",
  ];

  // Fixed originator distribution
  const originators = [
    "Saúde+ Clínica",
    "VidaMed Hospital",
    "Hospital São Lucas",
  ];

  // 15 fixed receivables with deterministic sizes (as % of vault raised)
  // Total face value will be ~120-130% of vault raised (typical advance rate ~80%)
  const sizeDistribution = [
    0.15, 0.12, 0.10, 0.09, 0.08,  // Top 5: 54%
    0.07, 0.06, 0.06, 0.05, 0.05,  // Mid 5: 29%
    0.04, 0.04, 0.03, 0.03, 0.03   // Low 5: 17%
  ]; // Total: 100% of raised amount

  // Scale to face value (assuming ~80% advance rate on average)
  const totalFaceValue = vaultRaised / 0.80;

  const receivables: Receivable[] = [];

  for (let i = 0; i < 15; i++) {
    const faceValue = totalFaceValue * sizeDistribution[i];
    const advancePct = 0.75 + (i % 5) * 0.03; // 75-87% range, deterministic
    const costBasis = faceValue * advancePct;

    // Deterministic dates based on index
    const issueDate = new Date(baseDate);
    issueDate.setDate(issueDate.getDate() - (15 + i * 3)); // Staggered 15-60 days ago

    const maturityDate = new Date(issueDate);
    maturityDate.setDate(maturityDate.getDate() + (45 + i * 4)); // 45-101 day terms

    // Deterministic assignments
    const originator = originators[i % originators.length];
    const payer = payers[i % payers.length];

    receivables.push({
      id: `INV-${(1001 + i).toString()}`,
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
        invoiceUrl: `https://docs.vitalfi.io/invoices/INV-${1001 + i}.pdf`,
        assignmentUrl: `https://docs.vitalfi.io/assignments/ASG-${1001 + i}.pdf`,
        txUrl: `https://solscan.io/tx/mock${(1001 + i).toString(36)}`,
      },
      notes: status === 'Disputed' ? 'Payment delayed due to administrative review' : undefined,
    });
  }

  return receivables;
}

/**
 * Calculate analytics from receivables (optimized - single pass)
 */
function calculateAnalytics(receivables: Receivable[]): CollateralAnalytics {
  let faceValueTotal = 0;
  let costBasisTotal = 0;
  let outstandingTotal = 0;
  let weightedDays = 0;
  const originatorTotals: Record<string, number> = {};
  const payerTotals: Record<string, number> = {};

  // Single pass through receivables
  for (const r of receivables) {
    faceValueTotal += r.faceValue;
    costBasisTotal += r.costBasis;

    if (r.status === 'Performing' || r.status === 'Matured') {
      outstandingTotal += r.expectedRepayment;
    }

    originatorTotals[r.originator] = (originatorTotals[r.originator] || 0) + r.faceValue;
    payerTotals[r.payer] = (payerTotals[r.payer] || 0) + r.faceValue;
  }

  // Calculate WAL in second pass (need totalNotional first)
  if (faceValueTotal > 0) {
    for (const r of receivables) {
      const days = r.daysToMaturity || 0;
      weightedDays += (r.faceValue / faceValueTotal) * days;
    }
  }

  // Find max concentrations
  const originatorValues = Object.values(originatorTotals);
  const topOriginatorPct = originatorValues.length > 0 && faceValueTotal > 0
    ? Math.max(...originatorValues) / faceValueTotal
    : 0;

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
 *
 * Uses fixed 15 receivables scaled to vault raised amount for realistic sizing.
 */
export function generateMockTransparencyData(
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
